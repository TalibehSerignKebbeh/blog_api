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
const User = require('./models/user');
const port = process.env.PORT;
const { Server } = require('socket.io')
const http = require('http');
const Notification = require('./models/Notification');
const { corsoptions } = require('./config/corsOptions');
const { AllowedRoles } = require('./config/configValues');


const httpServer = http.createServer(app)

const io = new Server(httpServer, {
  allowEIO3: true,
  
  cors: {
    origin: process.env?.ORIGINS?.split(' '), optionsSuccessStatus: 204,
    credentials: true,
    preflightContinue: true,

  },
  allowRequest: ((socketRequest, callback) => {
    const origin = socketRequest.headers.origin;

    const origins = process.env?.ORIGINS?.split(' ');
    if (origins && origins?.length && (origin?.indexOf(origin) !== -1)) {
      callback(null, true)

    } else {
      callback(new Error(`${origin} not allowed by cors`));
    }

  }),
})

app.use(cors(corsoptions))
app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.json({ limit: '200mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }))

connectDatabase()





app.use(express.static(path.join(__dirname, 'images')))
// app.use('static', express.static(path.join(__dirname, 'images')))


const IMAGES_DIR = './images'; // directory where images are stored
const PAGE_SIZE = 10; // number of images to display per page

app.post(`/normaldata`, async (req, res) => {
  // const blogs = await BlogModel.find().exec()
  await Notification.updateMany({}, { $set: { target_user: null } })
  // const blogsData = await BlogModel.find().lean().exec();
  const noficationsData = await Notification.find().lean().exec();
  const updates = await Promise.all(noficationsData?.map(async (notyData) => {
    const blog = await BlogModel.findById(notyData?.model).lean().exec()
    if (blog) {
      await Notification.findByIdAndUpdate(notyData?._id, { target_user: blog?.author })

    }
    const noficationDataLastes = await Notification.findById(notyData?._id).lean().exec()
    return { ...noficationDataLastes }
  }))

  return res.json({
    message: `done action`,
    updates
  })
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

app.post(`/image-upload`, upload.single('file'), function (req, res) {
  // console.log(req.file); // this will print the uploaded file information
  const filename = req.file.filename || '';

  const apiUrl = `${req.protocol}://${req.hostname}`;
  // console.log(apiUrl); // this will print the full API URL to the console

  if (filename) {
    return res.json({ message: `${filename} uploaded`, filename, fileurl: `${apiUrl}/${filename}` })
  }
  return res.json({ message: `${filename} not uploaded`, filename, fileurl: `${apiUrl}/${filename}` })

})
app.use('/mbyes_api/v1/blogs', require('./routes/blogRoutes'))
app.use('/mbyes_api/v1/users', require('./routes/userRoutes'))
app.use('/mbyes_api/v1/auth', require('./routes/authRoutes'))
app.use('/mbyes_api/v1/comments', require('./routes/commentRoutes'))



io.on('connection', async (socket) => {
  // socket._cleanup()
   socket.on("error", (err) => {
    console.log(`connect_error due to `);
    console.dir(err)
})
  console.log(socket?.connected);
  console.log(socket?.eventNames());
 
  const username = socket?.handshake?.auth?.username;
  const role = socket?.handshake?.auth?.role;
  socket.emit('connected', 'You are connected', (callback) => {
    // console.log(callback);
    console.log(callback?.status);
    console.log(callback?.message);
  })

  socket.on(`get_notifications`, async ({ role, user }) => {

    if (mongoose.Types.ObjectId.isValid(user)) {
      console.log('get notifications');
      const userData = await User.findById(user).lean().exec()
      if (userData && userData?.role === role) {

        if (role === AllowedRoles?.admin) {
          const notifications = await Notification.find({
            read: false, for: role,
          })
            .populate({ path: 'user', select: `-password` })
            .populate({ path: 'model', model: 'blogs' })
            .lean().exec()
          socket.emit(`notifications_${role}`, notifications)

          socket.emit(`notifications_${role}`, notifications)
        }
        else {
          const notifications = await Notification.find({
            read: false, for: role, target_user: user
          }).lean().exec()

            .populate({ path: 'user', select: `-password` })
            .populate({ path: 'target_user', select: `-password` })
            .populate({ path: 'model', model: 'blogs' })
            .lean().exec()
          socket.emit(`notifications_${role}_${user}`, notifications)

          socket.emit(`notifications_${role}_${user}`, notifications)
        }

      }

    }

    // socket.broadcast.emit(`notifications`, notifications)
  })

  socket.on(`blogposted`, async (data) => {
    if (mongoose.Types.ObjectId.isValid(data?.blogId)) {
      const notification = await Notification.findOne({ model: blogId })
        .populate({ path: 'user', select: `-password` })
        .populate({ path: 'model', model: 'blogs' })
        .lean().exec()
      socket.emit('blogpostnotify', notification)
      socket.broadcast.emit('blogpostnotify', notification)
    }
  })

  socket.on('blogvisited', async ({ id }) => {

    if (mongoose.Types.ObjectId.isValid(id)) {
      const blog = BlogModel.findById(id).lean().exec()
      const updatedBlog = await BlogModel.findByIdAndUpdate(id,
        {
          visit_count: !isNaN(blog?.visit_count) ? blog?.visit_count + 1 : 1
        }, { new: true })
      socket.emit('blogvisited_result', updatedBlog)
    }
  })

  socket.on('blog_publish', async ({ id, userId, date, }, callback) => {
    console.log('publishing blog');
    if (mongoose.Types.ObjectId.isValid(id) && mongoose.Types.ObjectId.isValid(userId)) {
      await BlogModel.findByIdAndUpdate(id,
        {
          publish: true, publisher: userId,
          publish_date: date
        },
        { new: true })

      const blog = await BlogModel.findById(id)
        .populate({ path: 'author', select: '-password' })
        .populate({ path: 'publisher', select: '-password' })
        .lean().exec()
      const userNotification = {
        message: `${blog?.title} publish`,
        model: id, user: userId, date: date,
        modelname: 'blog', for: 'user',
        target_user: blog?.author?._id
      }
      await Notification.create({ ...userNotification })

      socket.emit(`user_notify_${userId}`, userNotification)
      socket.emit(`blog_publish_${id}`, blog)
      socket.broadcast.emit(`blog_publish_${id}`, blog)
      socket.broadcast.emit(`publish_blog_result`, blog)
      callback({ status: 'ok', blog: blog })
    }
  })

  socket.on(`read_notification`, async (data) => {
    console.log(data);
    // if (data?.ids?.length) {
      
    // }
    if (mongoose.Types.ObjectId.isValid(data?.userId)) {
      const userData = await User.findById(data?.userId).lean().exec()
      if (!userData) return;
      const readed = await Notification.updateMany({
        _id: data?.ids, read: false, read_user: null
      },
        {
          read: true, read_user: data?.userId,
          read_date: data?.date || new Date()
        })
      console.log(readed);
      // to be completed for user and admin emits 
      if (readed?.acknowledged) {
        socket.broadcast.emit(`notification_read`, data?.ids)
        socket.emit(`notification_read`, data?.ids)
      }
    }

    // console.log(readed);
  })

  socket.on(`blog_published`, async ({ blogId, target_user }) => {
    if (mongoose.Types.ObjectId.isValid(target_user) && mongoose.Types.ObjectId.isValid(blogId)) {

      const notification = await Notification.findOne({ target_user, model: blogId }).lean().exec()

      if (notification) {
        const newNotification = await Notification.findOne({ target_user, model: blogId })
          .populate({ path: 'user', select: `-password` })
          .populate({ path: 'target_user', select: `-password` })
          .populate({ path: 'model', model: 'blogs' })
          .lean().exec()
        socket.emit(`user_blog_notify_${target_user}`, newNotification)
      }
      const blog = await BlogModel.findById(blogId)
        .populate({ path: 'author', select: `-password` })
        .populate({ path: 'publisher', select: `-password` })
        .lean().exec()
      socket.emit(`blog_publish_${blogId}`, blog)
    }
  })


})



io.on('disconnect', (socket) => {
  const role = socket?.handshake?.auth?.role;
  if (role && role === 'admin') {
    socket.join(['admin_rom'])
  }
  socket._cleanup()
  socket.disconnect()


})


mongoose.connection.once("open", () => {
  // io.once(`open`, () => {
   
  httpServer.listen(port, () => {
    // console.log(process.env.ORIGINS?.split(' ')?.length);
    console.log("App running on port", port);
  })
//  }) 
})
