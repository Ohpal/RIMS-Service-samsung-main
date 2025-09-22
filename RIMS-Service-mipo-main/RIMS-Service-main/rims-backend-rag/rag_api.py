from fastapi import FastAPI
from pydantic import BaseModel
from elasticsearch import Elasticsearch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import re, json, gc, torch, uvicorn
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings, HuggingFacePipeline
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# ======================= 초기 세팅 =======================
app = FastAPI()
max_letter_size = 300
es = Elasticsearch("http://192.100.0.10:9110")
INDEX_NAME = "lessonlearned"
device = "cuda" if torch.cuda.is_available() else "cpu"

tokenizer = None
model =None
gen_pipeline = None
embedding_model = None

model_name = "kakaocorp/kanana-nano-2.1b-instruct"

try:
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        trust_remote_code=True,
        torch_dtype=torch.float32,
        device_map="auto"  # or {"": "cpu"} to avoid "auto"
    )

    gen_pipeline = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=512
    )

    llm = HuggingFacePipeline(pipeline=gen_pipeline)
except Exception as e:
    gen_pipeline = None
    llm = None

# 전역 embedding 모델 재사용
try:
    embedding_model = HuggingFaceEmbeddings(
        model_name="jhgan/ko-sroberta-multitask",
        model_kwargs={"device": device}
    )
except Exception as e:
    embedding_model = None

# ======================= 유틸 함수 =======================
class QueryRequest(BaseModel):
    question: str

def trim_to_last_sentence(text, max_length=max_letter_size):
    if len(text) <= max_length:
        return text
    sub = text[:max_length]
    m = list(re.finditer(r'[.?!\.]\s*', sub))
    if m:
        cut = m[-1].end()
        return sub[:cut].strip()
    else:
        return sub.strip()

def clear_memory():
    gc.collect()
    torch.cuda.empty_cache()

# ======================= Elasticsearch 기반 검색 =======================
def elasticsearch_LLM(question: str):
    try:
        resp = es.search(
            index=INDEX_NAME,
            query={
                "multi_match": {
                    "query": question,
                    "fields": [
                        "project_issue^2",
                        "project_title",
                        "project_description"
                    ]
                }
            },
            size=3
        )

        actionresults = []
        features = []
        for hit in resp["hits"]["hits"]:
            action = hit["_source"].get("project_actionresult", "")
            if action:
                actionresults.append(action)
                features.append({
                    'id':hit["_source"].get("id"),
                    'project_title':hit["_source"].get('project_title'),
                    'project_date':hit["_source"].get('project_date'),
                    'project_department':hit["_source"].get('project_department'),
                    'project_commander':hit["_source"].get('project_commander'),
                    'project_part':hit["_source"].get('project_part'),
                    'project_description':hit["_source"].get('project_description'),
                    'project_issue':hit["_source"].get('project_issue'),
                    'project_actionresult':hit["_source"].get('project_actionresult'),
                    'project_files':hit["_source"].get('project_files'),
                })

        if not actionresults:
            return {"answer": "관련 시운전 지식 정보를 찾지 못했습니다.", "features":[]}

        context = "\n\n".join(actionresults)
        prompt = (
            "아래 여러 actionresult(조치 결과) 내용을 참고하여, "
            "질문에 대해 한글 완전한 문장으로만 요약 답변하세요. "
            "답변에는 해시태그, 키워드 리스트, 불완전한 문장을 포함하지 마세요.\n\n"
            f"{context}\n\n"
            f"질문: {question}\n"
            "답변:"
        )

        # pipeline을 통한 생성
        result = gen_pipeline(prompt, max_new_tokens=max_letter_size)[0]["generated_text"]
        answer = result[len(prompt):].strip() if result.startswith(prompt) else result
        answer = trim_to_last_sentence(answer)
        clear_memory()

        return {"answer": answer, "features": features}
    except Exception as e:
        return {"answer": f"에러 발생: {e}", "features":[]}

# ======================= RAG QA 수행 =======================
def run_rag_qa(question: str, jsonl_path="qaShip2.jsonl", prompt_name="기본"):

    # JSONL 문서 로딩
    docs = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            item = json.loads(line.strip())
            meta = item.get("metadata", {})
            if not isinstance(meta, dict):
                meta = {"metadata": meta}
            docs.append(Document(page_content=item["content"], metadata=meta))

    # 문서 쪼개기
    splitter = RecursiveCharacterTextSplitter(chunk_size=350, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    # FAISS 인덱싱
    vector_db = FAISS.from_documents(chunks, embedding_model)

    # LangChain Prompt 설정
    prompt_templates = {
        "기본": """{context}
질문에 대해 한글 완전한 문장으로만 요약 답변하세요.
[질문]
{question}

$답변:
"""
    }
    prompt = PromptTemplate(
        input_variables=["context", "question"],
        template=prompt_templates[prompt_name]
    )

    # QA 체인 구성
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vector_db.as_retriever(search_kwargs={"k": 5}),
        return_source_documents=True,
        input_key="question",
        chain_type_kwargs={
            "prompt": prompt,
            "document_variable_name": "context"
        }
    )

    result = qa_chain.invoke(question)
    answer = trim_to_last_sentence(result["result"].split('$')[-1], 500)
    clear_memory()

    return {"answer": answer}

# ======================= FastAPI 엔드포인트 =======================
@app.post("/rag")
def rag_query(req: QueryRequest):
    question = req.question
    if question.startswith("#"):
        return run_rag_qa(question)
    else:
        return elasticsearch_LLM(question)

# ======================= 서버 실행 =======================
def main():
    uvicorn.run("rag_api:app", host="0.0.0.0", port=4560)

if __name__ == "__main__":
    main()
