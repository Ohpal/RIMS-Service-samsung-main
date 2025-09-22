const lessonlearnedModel = require("../models/lessonlearnedModel")
const axios = require("axios")

// 모든 항목 조회
const selectAll = async (req, res) => {
  try {
    const datas = await lessonlearnedModel.selectAll()

    res.json(datas)
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error 500" })
  }
}

// // 특정 항목 조회(sql)
// const selectIssue = async (req, res) => {
//   try {
//     const issue = req.query.query || ""

//     const result = await lessonlearnedModel.selectIssue(issue)

//     if (result) {
//       res.json(result)
//       // res.status(200).json({ message: result.id })
//     } else {
//       res.status(404).json({ message: "Issue Not Found" })
//     }
//   } catch (error) {
//     res.status(500).json({ error: "Internal Server Error 500" })
//   }
// }

// 특정 항목 조회(sql)
const selectELK = async (req, res) => {
  try {
    const issue = req.query.query || ""
    if (issue == "") {
      const result_all = await lessonlearnedModel.selectAll()
      res.json(result_all)
    } else {
      const result = await lessonlearnedModel.selectELK(issue)

      if (result) {
        res.json(result)
      } else {
        res.status(404).json({ message: "Issue Not Found" })
      }
    }
  } catch (error) {
    res.status(500).json({ error: "Search Error" })
  }
}

// 모든 항목 조회
const selectFile = async (req, res) => {
  try {
    const { id } = req.params
    const datas = await lessonlearnedModel.selectFile(id)
    res.json(datas)
  } catch (err) {
    console.log(`Select File ERR>>${err}`)
    res.status(500).json({ error: "Internal Server Error 500" })
  }
}

// 조회수 증가
const incrementViews = async (req, res) => {
  try {
    const { id } = req.params
    const result = await lessonlearnedModel.incrementViews(id)

    // res.status(200).json({ message: "Views updated successfully" })
    // selectedPost.project_views + 1);

    if (result) {
      return res.status(200).send("Views updated successfully")
    } else {
      return res.status(404).send("incrementViews Failed")
    }
  } catch (error) {
    console.error("Error incrementing views:", error)
    res.status(500).json({ message: "Error incrementing views" })
  }
}

// 지식 공유하기(글쓰기)
const create = async (req, res) => {
  try {
    if (!req.body.project_title) {
      res.status(400).send({ message: "Content can't be empty" })
      return
    }

    // create a LessonLearned
    const lessonlearned = {
      project_title: req.body.project_title,
      project_date: req.body.project_date,
      project_department: req.body.project_department,
      project_commander: req.body.project_commander,
      project_part: req.body.project_part,
      project_description: req.body.project_description,
      project_issue: req.body.project_issue,
      project_actionresult: req.body.project_actionresult,
      project_files: req.body.project_files,
      project_views: req.body.project_views,
      show_bool: req.body.show_bool ? req.body.show_bool : false,
    }

    const result = await lessonlearnedModel.create(lessonlearned)

    if (result) {
      res.json(result)
    } else {
      res.status(404).json({ message: "Create Error 404" })
    }
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error 500" })
    console.error(err)
  }
}

// 지식 업데이트
const update = async (req, res) => {
  const { id, project_title, project_date, project_department, project_commander, project_part, project_description, project_issue, project_actionresult } = req.body

  try {
    if (!id) {
      return res.status(400).send("Lesson ID is required.")
    }

    // 데이터베이스에서 lesson 정보 업데이트
    const updatedResult = await lessonlearnedModel.update({
      id,
      project_title,
      project_date,
      project_department,
      project_commander,
      project_part,
      project_description,
      project_issue,
      project_actionresult,
    })

    if (updatedResult) {
      return res.status(200).send("Lesson updated successfully.")
    } else {
      return res.status(404).send("Lesson not found.")
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Internal Server Error 500" })
  }
}

// LLM 검색 및 답변
const questionLLM = async (req, res) => {
  const { question } = req.body || ""

  if (!question.trim()) return res.status(400).send({ error: "Question is Empty!" })

  try {
    // console.log("GET DATA>>", question)
    const result = await axios.post("http://192.100.0.10:4560/rag", { question })
    // console.log("SET data>>", result)
    // 데이터베이스에 LLM 검색 및 답변 저장
    const saveLLMQA = await lessonlearnedModel.saveLLMQA(question, result.data.answer)

    if (saveLLMQA) {
      console.log("save QA")
    }

    res.json({ answer: result.data.answer, features: result.data.features })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.toString() })
  }
}

// LLM 검색 및 답변 저장

module.exports = {
  selectAll,
  selectELK,
  selectFile,
  create,
  update,
  incrementViews,
  questionLLM,
}
