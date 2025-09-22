# 라이브러리 설정
import os
import io
import psycopg2
import pandas as pd
import numpy as np
import matplotlib
import json
import traceback

from math import pi
from sklearn.linear_model import LinearRegression
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from sdv.single_table import GaussianCopulaSynthesizer
from sdv.single_table import CTGANSynthesizer
from sdv.single_table import TVAESynthesizer
from sdv.metadata import SingleTableMetadata
from scipy.stats import ks_2samp
from matplotlib.ticker import FuncFormatter
from flask import Response

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.collections import LineCollection

# Matplotlib 한글 폰트 설정
plt.rc("font", family="Malgun Gothic")

# Matplotlib 스타일 설정 (필요시 수정)
FIGSIZE = (12, 6)  # 그림 크기
TITLE_FONTSIZE = 16  # 제목 폰트 크기
LABEL_FONTSIZE = 12  # 축 라벨 폰트 크기
TICK_LABELSIZE = 10  # 눈금 라벨 폰트 크기
LEGEND_FONTSIZE = 12  # 범례 폰트 크기
FACE_COLOR = "#F8F9FA"  # 배경 색상

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
CORS(app)


# DB 연결
def get_db_connection():
    return psycopg2.connect(
        host=os.environ.get("DB_HOST", "rims.iptime.org"),
        port=int(os.environ.get("DB_PORT", 10432)),
        user=os.environ.get("DB_USER", "tapp"),
        password=os.environ.get("DB_PASSWORD", "tapp.123"),
        database=os.environ.get("DB_NAME", "svcfw"),
    )


# 원화 포맷 함수
def format_won(value: float) -> str:
    return f"{value:,.2f}원"


# Flask 서버 설정
@app.route("/")
def index():
    return jsonify({"message": "Flask server is running."})


try:
    import chardet
except ImportError:
    chardet = None


# CSV 업로드 받기
@app.route("/synth-data/upload", methods=["POST"])
def synth_data_upload():
    if "file" not in request.files:
        return jsonify({"error": "파일이 없습니다."}), 400

    f = request.files["file"]
    raw = f.read()
    if not raw:
        return jsonify({"error": "빈 파일입니다."}), 400

    enc_tried = None
    try:
        # 1) 인코딩 탐지 (fallback: utf-8)
        if chardet:
            enc_tried = chardet.detect(raw).get("encoding") or "utf-8"
        else:
            enc_tried = "utf-8"

        # 2) 구분자 자동 추정 (engine='python' 필요), 문제행 스킵
        df = pd.read_csv(
            io.BytesIO(raw),
            encoding=enc_tried,
            engine="python",
            sep=None,  # 자동 추정 (콤마/세미콜론 등)
            on_bad_lines="skip",  # 깨진 라인 무시 (pandas>=1.3)
        )

        # 헤더 공백 제거 정도만 (프런트는 원래 헤더를 그대로 써도 됩니다)
        df.columns = [c.strip() for c in df.columns]

        # 3) (옵션) 프런트에서 schema 내려보내면 타입/포함 처리
        schema_json = request.form.get("schema")
        if schema_json:
            try:
                schema = json.loads(schema_json)
                for col, meta in schema.items():
                    if not meta.get("include", True):
                        df.drop(columns=[col], inplace=True, errors="ignore")
                    else:
                        sel = meta.get("selectedType")
                        if sel == "Categorical":
                            df[col] = df[col].astype(str)
                        elif sel == "Continuous":
                            df[col] = pd.to_numeric(df[col], errors="coerce")
            except json.JSONDecodeError:
                return jsonify({"error": "schema 파싱 실패"}), 400

        # NaN -> None (JSON 직렬화 안전)
        df = df.where(pd.notnull(df), None)

        return jsonify(
            {"columns": df.columns.tolist(), "records": df.to_dict(orient="records")}
        )

    except Exception as e:
        return (
            jsonify(
                {
                    "error": "CSV 처리 중 오류",
                    "details": str(e),
                    "encoding_tried": enc_tried,
                    "traceback": traceback.format_exc(),
                }
            ),
            500,
        )


# PostgreSQL 연결 함수
def get_db_connection():
    return psycopg2.connect(
        host="rims.iptime.org",
        port=10432,
        user="tapp",
        password="tapp.123",
        database="svcfw",
    )


# CSV 파일을 DB에 저장하는 엔드포인트
@app.route("/synth-data/save-to-db", methods=["POST"])
def save_csv_to_db():
    try:
        file = request.files.get("file")
        table_name = request.form.get("table_name")
        username = request.form.get("username", "unknown")
        schema_name = request.form.get("schema_name", "begas")  # 기본 스키마

        if not file or not table_name:
            return jsonify({"error": "file/table_name 필수"}), 400

        # 데이터프레임 변환
        df = pd.read_csv(file, encoding="utf-8-sig")
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 사용자/저장시간 컬럼 추가
        df["created_by"] = username
        df["created_at"] = now

        conn = get_db_connection()
        cur = conn.cursor()

        # 테이블 존재여부 확인 (스키마 지정)
        cur.execute(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema=%s AND table_name=%s)",
            (schema_name, table_name),
        )
        exists = cur.fetchone()[0]

        # 이미 있으면 프론트에 알림 후 force 옵션 체크
        if exists and request.form.get("force") != "true":
            cur.close()
            conn.close()
            return jsonify(
                {
                    "exists": True,
                    "message": f"테이블 '{schema_name}.{table_name}' 이(가) 이미 존재합니다. 덮어쓸까요?",
                }
            )

        # 기존 테이블 삭제 (덮어쓰기 허용 시)
        if exists:
            cur.execute(f'DROP TABLE IF EXISTS "{schema_name}"."{table_name}" CASCADE')

        # CREATE TABLE 구문 생성 (dtype→PostgreSQL 매핑, 기본은 TEXT)
        col_defs = ", ".join([f'"{col}" TEXT' for col in df.columns])
        create_sql = f'CREATE TABLE "{schema_name}"."{table_name}" ({col_defs})'
        cur.execute(create_sql)

        # 데이터 insert
        for _, row in df.iterrows():
            vals = tuple(row)
            placeholders = ", ".join(["%s"] * len(row))
            cur.execute(
                f'INSERT INTO "{schema_name}"."{table_name}" VALUES ({placeholders})',
                vals,
            )
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(
            {
                "success": True,
                "message": f"'{schema_name}.{table_name}' 테이블에 저장 완료",
            }
        )

    except Exception as e:
        import traceback

        return (
            jsonify(
                {
                    "error": "DB 저장 중 오류",
                    "details": str(e),
                    "trace": traceback.format_exc(),
                }
            ),
            500,
        )


# 필드 스키마 저장 엔드포인트
@app.route("/analysis-api/save-field-schema", methods=["POST"])
def save_field_schema():
    try:
        data = request.get_json()
        schema = data["schema"]
        table_name = data.get("table_name", "analysis_field_schema")
        created_by = data.get("created_by", "unknown")
        created_at = datetime.now()
        # ⭐️ 스키마 자동 보정
        if "." not in table_name:
            schema_name = "begas"
            table_name_full = f'"{schema_name}"."{table_name}"'
        else:
            s, t = table_name.split(".", 1)
            table_name_full = f'"{s}"."{t}"'

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            f"""
          CREATE TABLE IF NOT EXISTS {table_name_full} (
            col_name TEXT,
            field TEXT,
            created_by TEXT,
            created_at TIMESTAMP DEFAULT now()
          )
        """
        )
        for item in schema:
            col_name = item.get("col_name") or item.get("column")
            cur.execute(
                f"INSERT INTO {table_name_full} (col_name, field, created_by, created_at) VALUES (%s, %s, %s, %s)",
                (col_name, item["field"], created_by, created_at),
            )
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"result": "success"})
    except Exception as e:
        import traceback

        return (
            jsonify(
                {
                    "error": "DB 저장 중 오류",
                    "details": str(e),
                    "trace": traceback.format_exc(),
                }
            ),
            500,
        )


# 샘플 데이터 생성
@app.route("/synth-data/sample", methods=["POST"])
def generate_sample():
    try:
        records_json = request.form.get("records")
        schema_json = request.form.get("schema")
        n_rows = int(request.form.get("n_rows", 10))
        algorithm = request.form.get("algorithm", "Copula")

        if not records_json or not schema_json:
            return jsonify({"error": "records 또는 schema 누락"}), 400

        records = json.loads(records_json)
        schema = json.loads(schema_json)

        included_cols = [
            col for col, meta in schema.items() if meta.get("include", True)
        ]
        df = pd.DataFrame(
            [{col: row.get(col, None) for col in included_cols} for row in records]
        )

        for col in included_cols:
            selected_type = schema[col].get("selectedType") or schema[col].get(
                "inferredType"
            )
            if selected_type == "Categorical":
                df[col] = df[col].astype(str)
            elif selected_type == "Continuous":
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # SDV 메타데이터 설정
        metadata = SingleTableMetadata()
        metadata.detect_from_dataframe(df)

        if algorithm == "Copula":
            from sdv.single_table import GaussianCopulaSynthesizer

            model = GaussianCopulaSynthesizer(metadata)
        elif algorithm == "CTGAN":
            from sdv.single_table import CTGANSynthesizer

            model = CTGANSynthesizer(metadata)
        elif algorithm == "TVAE":
            from sdv.single_table import TVAESynthesizer

            model = TVAESynthesizer(metadata)
        else:
            return jsonify({"error": "지원되지 않는 알고리즘"}), 400

        model.fit(df)
        samples = model.sample(n_rows).fillna("")
        return jsonify(samples.to_dict(orient="records"))

    except Exception as e:
        return jsonify({"error": "샘플 생성 실패", "details": str(e)}), 500


# 통계 비교
@app.route("/synth-data/statistics", methods=["POST"])
def generate_statistics():
    try:
        data = request.get_json()
        original = pd.DataFrame(data["original"])
        synthetic = pd.DataFrame(data["synthetic"])
        schema = data["schema"]

        stats_result = {}
        for col, meta in schema.items():
            if not meta.get("include", True):
                continue
            dtype = meta.get("selectedType") or meta.get("inferredType")
            if dtype != "Continuous":
                continue

            orig_col = pd.to_numeric(original[col], errors="coerce").dropna()
            synth_col = pd.to_numeric(synthetic[col], errors="coerce").dropna()

            if orig_col.empty or synth_col.empty:
                continue  # 유효한 값이 없으면 건너뜀

            stats_result[col] = {
                "mean_orig": float(orig_col.mean()),
                "mean_synth": float(synth_col.mean()),
                "std_orig": float(orig_col.std()),
                "std_synth": float(synth_col.std()),
                "min_orig": float(orig_col.min()),
                "min_synth": float(synth_col.min()),
                "max_orig": float(orig_col.max()),
                "max_synth": float(synth_col.max()),
                "iqr_orig": float(orig_col.quantile(0.75) - orig_col.quantile(0.25)),
                "iqr_synth": float(synth_col.quantile(0.75) - synth_col.quantile(0.25)),
                "p_value": float(ks_2samp(orig_col, synth_col).pvalue),
            }

        return jsonify({"statistics": stats_result})

    except Exception as e:
        return jsonify({"error": "통계 생성 실패", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=4850)
