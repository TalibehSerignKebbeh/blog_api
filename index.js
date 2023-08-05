require('dotenv').config()
const express = require("express");
const cors = require('cors')
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const app = express()
const path = require('path');
const connectDatabase = require('./config/dbClent');
const upload = require('./middlewares/upload');
const BlogModel = require('./models/BlogModel');
const user = require('./models/user');
const port = process.env.PORT;

app.use(cors({origin: "*"}))
app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.json({ limit: '200mb', extended: true }))
app.use(bodyParser.urlencoded({limit: '200mb', extended: true}))

connectDatabase()





app.use(express.static(path.join(__dirname, 'images')))
// app.use('static', express.static(path.join(__dirname, 'images')))


const IMAGES_DIR = './images'; // directory where images are stored
const PAGE_SIZE = 10; // number of images to display per page

app.post(`/normaldata`, async (req, res) => {
  // const blogs = await BlogModel.find().exec()
  
  
  return res.json({message:`done action`})
})
// Route for getting images
app.get('/images', (req, res) => {
  const page = parseInt(req.query.page) || 1; // page number, defaults to 1
  const startIndex = (page - 1) * PAGE_SIZE; // starting index of images to display
  const endIndex = startIndex + PAGE_SIZE; // ending index of images to display
  const files = fs.readdirSync(IMAGES_DIR); // get all files in the directory
  const images = files.filter(file => /\.(jpe?g|png|gif)$/i.test(file)).slice(startIndex, endIndex); // filter only image files and get the slice of images for the current page

  res.send(images);
});

app.post(`/image-upload`,  upload.single('file'), function (req, res) {
    // console.log(req.file); // this will print the uploaded file information
  const filename = req.file.filename || '';
  
    const apiUrl = `${req.protocol}://${req.hostname}`;
  // console.log(apiUrl); // this will print the full API URL to the console
 
    if (filename) {
        return res.json({message: `${filename} uploaded`, filename, fileurl: `${apiUrl}/${filename}`})
    }
        return res.json({message: `${filename} not uploaded`, filename, fileurl: `${apiUrl}/${filename}`})

})
app.use('/mbyes_api/v1/blogs', require('./routes/blogRoutes'))
app.use('/mbyes_api/v1/users', require('./routes/userRoutes'))
app.use('/mbyes_api/v1/auth', require('./routes/authRoutes'))
app.use('/mbyes_api/v1/comments', require('./routes/commentRoutes'))



mongoose.connection.once("open", () => {
    app.listen(port, () => {
    console.log("App running on port", port);
})
})
