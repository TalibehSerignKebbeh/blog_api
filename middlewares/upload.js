const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null,  file.fieldname + '-' + uniqueSuffix+ path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024, fieldSize:1048578 * 10 }
})

module.exports = upload