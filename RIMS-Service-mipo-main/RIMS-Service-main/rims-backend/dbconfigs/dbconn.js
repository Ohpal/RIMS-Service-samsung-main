require("dotenv").config()
const { Pool } = require("pg")

// PostgreSQL 연결 설정(Local)
// const pool = new Pool({
//   connstionString: process.env.DATABASE_URL,
//   user: process.env.DB_USER,
//   // host: process.env.DB_HOST,
//   // database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   // port: process.env.DB_PORT,
// })

// // PostgreSQL 연결 설정(수도권사무소)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: "-c search_path=lessonlearned",
})
module.exports = pool
