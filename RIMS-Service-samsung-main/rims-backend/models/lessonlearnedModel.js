const pool = require("../dbconfigs/dbconn")
const esClient = require("../dbconfigs/elkconn")

const index_name = "lessonlearned"

// 모든 항목 조회
const selectAll = async () => {
  try {
    const result = await pool.query("SELECT * FROM rims.lessonlearned_tb order by id desc")

    return result.rows
  } catch (err) {
    console.error(err)
  }
}

// 특정 컬럼에서 검색 항목 조회(SQL)
const selectIssue = async (issue) => {
  try {
    const columns = ["project_title", "project_department", "project_commander", "project_part", "project_description", "project_issue", "project_actionresult"]

    let qry = `SELECT * FROM rims.lessonlearned_tb WHERE `

    columns.forEach((column, index) => {
      qry += `${column} ILIKE '%${issue}%'`

      if (index < columns.length - 1) qry += " OR "
    })
    qry += ` ORDER BY id DESC`

    const result = await pool.query(qry)

    return result.rows
  } catch (err) {
    console.error(err)
  }
}

// 특정 컬럼에서 검색 항목 조회(ELK)
const selectELK = async (issue) => {
  try {
    const health = await esClient.cluster.health()
    if (health.body.status != "red") {
      let result = await esClient.search({
        index: index_name,
        body: {
          query: {
            multi_match: {
              query: issue,
              fields: ["project_title", "project_description", "project_department", "project_commander", "project_part", "project_issue", "project_actionresult"],
              operator: "and",
            },
          },
        },
      })
      return result.body.hits.hits.map((hit) => hit._source)
    }
  } catch (err) {
    console.error(err)
    return []
  }
}

// 조회수 증가
const incrementViews = async (id) => {
  try {
    let qry = `UPDATE rims.lessonlearned_tb SET project_views = project_views + 1 WHERE id = $1 RETURNING project_views;`

    const result = await pool.query(qry, [id])
    return result.rows[0]
  } catch (error) {
    console.error("incrementViews ERR>>", error)
  }
}

// 항목 생성
const create = async (lessonlearned) => {
  try {
    let qry = `INSERT INTO rims.lessonlearned_tb(project_title, project_date, project_department, project_commander, project_part, project_description, project_issue, project_actionresult, project_files, project_views, show_bool, project_created, project_updated)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`

    let values = [lessonlearned.project_title, lessonlearned.project_date, lessonlearned.project_department, lessonlearned.project_commander, lessonlearned.project_part, lessonlearned.project_description, lessonlearned.project_issue, lessonlearned.project_actionresult, lessonlearned.project_files, lessonlearned.project_views, lessonlearned.show_bool, "now()", "now()"]

    const result = await pool.query(qry, values)
    return result.rows[0]
  } catch (error) {
    console.error("create ERR>>", error)
  }
}

// 항목 업데이트(수정)
const update = async (lessonlearned) => {
  try {
    const { id, project_title, project_date, project_department, project_commander, project_part, project_description, project_issue, project_actionresult } = lessonlearned

    let qry = `UPDATE rims.lessonlearned_tb
        SET project_title = $1,
          project_date = $2,
          project_department = $3,
          project_commander = $4,
          project_part = $5,
          project_description = $6,
          project_issue = $7,
          project_actionresult = $8,
          project_updated = $9
        WHERE id = $10`
    const values = [project_title, project_date, project_department, project_commander, project_part, project_description, project_issue, project_actionresult, "now()", id]

    const result = await pool.query(qry, values)
    return result.rowCount > 0
  } catch (error) {
    console.error("Update ERR>>", error)
  }
}

// 파일 항목 조회
const selectFile = async (id) => {
  try {
    // const result = await pool.query("SELECT * FROM lessonlearned.lessonlearned_file_tb WHERE id IN (SELECT id FROM lessonlearned.lessonlearned_tb WHERE project_files = TRUE)")
    const result = await pool.query("SELECT * FROM rims.lessonlearned_file_tb WHERE id = $1", [id])

    return result.rows
  } catch (err) {
    console.error(err)
  }
}

// LLM 질문 답변 저장
const saveLLMQA = async (question, answer) => {
  try {
    const result = await pool.query("INSERT INTO rims.lessonlearned_qa_tb (question, answer) values($1, $2) RETURNING *", [question, answer])

    return result.rows[0]
  } catch (err) {
    console.error(err)
  }
}

module.exports = {
  selectAll,
  selectIssue,
  selectELK,
  selectFile,
  create,
  update,
  incrementViews,
  saveLLMQA,
}
