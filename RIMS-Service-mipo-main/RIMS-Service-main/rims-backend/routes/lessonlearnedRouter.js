var express = require("express")
const lessonlearnedController = require("../controllers/lessonlenaredControllers")
const fileController = require("../controllers/fileController")
var router = express.Router()

// Create a new 지식공유
router.post("/", lessonlearnedController.create)

// 특정 ID 업데이트
router.put("/update", lessonlearnedController.update)

// // Retrieve all Tutorials
// router.get("/", lessonlearned.findAll)

// // Update a Lessonlearned favorite with id
// router.put("/:id", lessonlearned.updateFavorite)

// 모든 항목 조회
router.get("/", lessonlearnedController.selectAll)

// 모든 파일 조회
router.get("/file/:id", lessonlearnedController.selectFile)

// 특정 항목 조회(sql)
// router.get("/search", lessonlearnedController.selectIssue)

// 특정 항목 조회(ELK)
router.get("/search", lessonlearnedController.selectELK)

// 조회수 증가
router.post("/:id/views", lessonlearnedController.incrementViews)

// 파일 업로드
router.post("/upload", fileController.uploadFile)

// 파일 다운로드
router.get("/download", fileController.downloadFile)

// LLM 데이터 처리
router.post("/ask", lessonlearnedController.questionLLM)

module.exports = router
