// 파일 업로드
const pool = require("../dbconfigs/dbconn")

const saveFile = async (fileData, project_id) => {
  const filename = fileData.originalname
  const path = `${fileData.destination}${filename}`
  const mimetype = fileData.filename.split(".")[1]
  const filesize = fileData.size

  try {
    const qry = `INSERT INTO rims.lessonlearned_file_tb (id, filename, filepath, mimetype, filesize) VALUES($1, $2, $3, $4, $5) RETURNING *`
    const values = [project_id, filename, path, mimetype, filesize]
    const result = await pool.query(qry, values)

    return result.rows[0]
  } catch (error) {
    console.error(`Save File ERR>>${error}`)
  }
}

const searchFile = async (fileID, fileName) => {
  try {
    let qry = `SELECT * FROM rims.lessonlearned_file_tb WHERE id = ${fileID} AND filename = '${fileName}'`

    const result = await pool.query(qry)

    return result.rows
  } catch (err) {
    console.error(`Search File ERR>>${err}`)
  }
}

const getFilesById = async (Id) => {
  const qry = `SELECT * FROM rims.lessonlearned_file_tb WHERE id = $1`
  const values = [Id]

  try {
    const result = await pool.query(qry, values)
    return result.rows
  } catch (error) {
    console.error("Database fetch files error:", error)
    throw error
  }
}

const deleteFilesById = async (Id) => {
  const qry = `DELETE FROM rims.lessonlearned_file_tb WHERE id = $1`
  const values = [Id]

  try {
    await pool.query(qry, values)
  } catch (error) {
    console.error("Database delete files error:", error)
    throw error
  }
}

module.exports = {
  saveFile,
  searchFile,
  getFilesById,
  deleteFilesById,
}
