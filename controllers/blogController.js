const BlogModel = require("../models/BlogModel");
const fs = require("fs");
const { default: mongoose } = require("mongoose");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require('express-async-handler')
const upload = require('../middlewares/upload');
const user = require("../models/user");


const PostBlog = asyncHandler(async (req, res) => {
  const { title, image, content, tags,created_at,
created_timezoneOffset,
 } = req.body;
  // const image = req.file.filename;

  const username = req.user;
  const currentUser = await user.findOne({ username }).exec()
  if (!currentUser) return res.status(401).json({ message: `Unauthorized access` })
 

  const newBlog = await BlogModel.create({
    title,
    content,
    tags,
    image,
    author: currentUser?._id,
    created_at,
created_timezoneOffset,
updated_at:created_at,
updated_timezoneOffset:created_timezoneOffset
    
  });
  if (newBlog) {
    return res.json({
      status: "success",
      message: `${newBlog?.title} created `,
    });
  }
  return res.status(400).json({ status: "error", message: "An error occured" });
}); 


const GetBlogs = asyncHandler(async (req, res) => {
  const { page, size } = req.query;
  console.log(page, size);
  // console.log(req.query);
  const blogs = await BlogModel.find().sort({ created_at: -1, publish: -1 })
    .populate({ path: 'author', select: `-password` })
    .skip(+page * +size).limit(+size).exec();
  const total = await BlogModel.countDocuments();
  const pageCount = Math.ceil(+total / +size)
  return res.json({
    status: "success",
    blogs, total, pageCount, size, page,
  });
});
const GetBlogsInfinitely = asyncHandler(async (req, res) => {
  const { page, size, offset } = req.query;

  const blogs = await BlogModel.find()
    .sort({ created_at: -1, publish: -1 })
    .populate({ path: 'author', select: `-password` })
    .skip(+offset)
    .limit(+size)
    .exec();

  const total = await BlogModel.countDocuments();
  const pageCount = Math.ceil(total / +size);
  const offsetValue = Number(size) + Number(offset);
  
  return res.json({
    status: "success",
    blogs,
    total,
    pageCount,
    size,
    page,
    offset: offsetValue,
  });
});


const DeleteBlog = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: `invalid params` })
  }
  const blog = await BlogModel.findById(id).exec()

  if (!blog) return res.status(400).json({ message: `blog not found` })

  const deleted = await BlogModel.findByIdAndDelete(id).exec();
  return res.json({ message: `deleted ${deleted?.title}` });
});

const SetBlogImage = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { image } = req.body;
  const updatedBlog = await BlogModel.findByIdAndUpdate(id, { image: image }).exec();
  //   console.log(updatedBlog);
  return res.json({ message: `operation done ${updatedBlog?.title}` });
});
const GetSingleBlogById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'invalid params' });

  }
  const blog = await BlogModel.findById(id).populate({path:'author', select:`-password`}).exec();
  return res.json({ blog });
});

const GetSingleBlogByTitle = asyncHandler(async (req, res) => {
  const { title } = req.query;
  let formattedTitle = title?.replace(/[-]/g, " ")
  // title?.split('%').join('/')

  const blog = await BlogModel.findOne({ title: formattedTitle }, {}, { collation: { strength: 1, locale: 'en' } }).populate({path:'author', select:`-password`}).exec();
  if (!blog) return res.status(400).json({ message: `blog was not found` })
  return res.json({ blog });
});

const UpdateBlog = asyncHandler(async (req, res) => {
  const { title, image, content, tags,
updated_at,
updated_timezoneOffset} = req.body;

  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'invalid params' });
  }
  const blog = await BlogModel.findById(id).exec()
  if(!blog) return res.sendStatus(400).json({message:`Blog not found`})
  await BlogModel.findByIdAndUpdate(id, { title, image, content, tags,updated_at,
updated_timezoneOffset }).exec();
  return res.json({ message: `update succussful` });

})

const ToggleBlogPublished = asyncHandler(async (req, res) => {

  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'invalid params',status:'error' });
  }
  const blog = await BlogModel.findById(id).exec()
  if(!blog) return res.sendStatus(400).json({message:`Blog not found`})
  await BlogModel.findByIdAndUpdate(id, { publish: !blog?.publish }).exec();
  return res.json({ message: `update succussful`, status:'success' });

})
const GetDashBoardStatistics = asyncHandler(async (req, res) => {
  const blogCount = await BlogModel.count()
  const recentDate = new Date(new Date().getFullYear(),
  new Date().getMonth(), new Date().getDate()-2).toUTCString()
  // const recentBlogs = await BlogModel.find({ created_at: { $gte: recentDate } }, {}).select('-content').populate({path:'author', select:'-password'})
  const recentBlogs = await BlogModel.find({}, {}).select('-content').populate({path:'author', select:'-password'}).sort({created_at:-1, publish:-1}).limit(10)
  const recentUsers = await user.find().select('-password').limit(10)
  const editorCount = await user.countDocuments({ role: 'editor' })
  
  const adminCount = await user.countDocuments({ role: 'admin' })
  const normalUserCount = await user.countDocuments({role:'user'})
  const subscribersCount = await user.countDocuments()
  
  return res.json({
    recentBlogs, recentUsers,
    blogCount, editorCount, normalUserCount, adminCount, subscribersCount
  })
})

const RefetchRecentBlogs = asyncHandler(async(req, res) => {
  const recentBlogs = await BlogModel.find({}, {}).select('-content').populate({path:'author', select:'-password'}).sort({created_at:-1, publish:-1}).limit(10)
  return res.json({recentBlogs})
})


const GetTagBlogs = asyncHandler(async (req, res) => {

  const tag = req.params.tag || req.query.tag;
  const page = req.query.page || req.params.page || 0;
  const size = req.params.pageSize || req.query.pageSize || 10;
  const queryFilters = {
    $or: [
      { title: { $regex: tag, $options:'i' } },
      { tags: {$regex:tag, $options:'i'} },
      // {content: { $regex: tag, $options:'i' }}
    ]
  }
  const queryFilters2 = {
    $or: [{ title: { $regex: `${tag}`, $options: 'i' } },
      { tags: { $regex: `${tag}`, $options: 'i' } },
    { content: { $regex: `${tag}`, $options: 'i' } }
    ]
  }
  
  const blogs = await BlogModel.find({...queryFilters}).skip(+page * +size).limit(+size).lean();
  const total = await BlogModel.countDocuments({...queryFilters})
  return res.json({
    blogs, page, pageSize: size,
    total
  })
})

function convertBase64ToFile(base64String, filePath) {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  fs.writeFileSync(filePath, buffer, "binary");

  return filePath;
}



module.exports = {
  PostBlog,
  GetBlogs,
  DeleteBlog,
  SetBlogImage,
  GetSingleBlogById,
  GetSingleBlogByTitle,
  GetDashBoardStatistics,
  UpdateBlog,
  ToggleBlogPublished,
  RefetchRecentBlogs,
  GetTagBlogs,GetBlogsInfinitely
};
