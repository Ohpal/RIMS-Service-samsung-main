const path = require("path")
const multer = require("multer")
const fileModel = require("../models/fileModel")
const fs = require("fs")

const FILE_PATH = path.join(__dirname, "../SeaTrialFile/")
// const FILE_PATH = "C:/RIMS/SeaTrialFile/"
//const FILE_PATH = "C:/Users/RIMS-Server1/Documents/SeaTrialFile"

if (!fs.existsSync(FILE_PATH)) {
  fs.mkdirSync(FILE_PATH, { recursive: true })
}

// multer 설정 (storage 옵션 설정)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, FILE_PATH) // 파일 저장 폴더
  },
  filename: function (req, file, cb) {
    file.originalname = Buffer.from(file.originalname, "latin1").toString("utf-8")
    cb(null, `${file.originalname}`) // 파일명 설정
  },
})

// multer 미들웨어 (다중 파일 업로드를 위한 array 사용)
const upload = multer({ storage: storage }).array("files", 5) // 최대 5개의 파일 허용

// 파일 업로드 컨트롤러
const uploadFile = (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (!req.files || req.files.length === 0) {
        console.log("No files uploaded")
        return res.status(400).send({ message: "No Files uploaded" })
      }
      const project_id = req.query.id

      // 각 파일 메타데이터를 DB에 저장
      const fileMetaDatas = req.files.map(async (file) => {
        try {
          return await fileModel.saveFile(file, project_id)
        } catch (err) {
          console.error(`Error saving file ${file} >> ${err}`)
        }
      })

      const fileIds = await Promise.all(fileMetaDatas)

      res.status(200).send({ message: `Files uploaded successfully, ${fileIds}`, fileIds: fileIds })
    } catch (err) {
      res.status(500).send({ message: "File upload failed", error: err.message })
      console.error(err)
    }
  })
}

const downloadFile = async (req, res) => {
  const file_name = req.query.file
  const file_id = req.query.id
  
  console.log('111', file_name, file_id)

  if (!file_name || !file_id) {
    return res.status(400).send("File name and File Id are required")
  }

  try {
	  
    // 데이터베이스에서 파일 검색
    const result = await fileModel.searchFile(file_id, file_name)

    if (result.length === 0) {
      return res.status(404).send("File not found.")
    }

    const file_path = result[0].filepath

    // 파일 다운로드
    // 파일 다운로드 처리
    const encodedFileName = encodeURIComponent(file_name)
    res.setHeader("Content-Type", "application/octet-stream")
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`)
    // res.download(file_path, file_name, (err) => {
    //   if (err) {
    //     console.error("파일 다운로드 오류:", err)
    //     res.status(500).send("파일을 다운로드할 수 없습니다.")
    //   }
    // })

    // 파일 스트림을 통해 파일을 전송
    const fileStream = fs.createReadStream(file_path)
    fileStream.pipe(res)

    fileStream.on("error", (err) => {
      console.error("File stream error:", err)
      res.status(500).send("File could not be read.")
    })
  } catch (error) {
    console.error("파일 검색 중 오류:", error)
    res.status(500).send("서버 오류가 발생했습니다.")
  }
}

module.exports = {
  uploadFile,
  downloadFile,
}
