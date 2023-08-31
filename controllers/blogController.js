const BlogModel = require("../models/BlogModel");
const fs = require("fs");
const { default: mongoose } = require("mongoose");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require('express-async-handler')
const upload = require('../middlewares/upload');
const user = require("../models/user");
const Notification = require("../models/Notification");


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
updated_at:created_at,
    
  });
  if (newBlog) {
    await Notification.create({
      message: `${currentUser?.public_name || currentUser?.username} publish ${newBlog?.title}`,
      date: created_at,
      model: newBlog?._id?.toString(),
      user: currentUser?.id,
      modelname:'blog',for:'admin'
    })
    return res.json({
      status: "success",
      message: `${newBlog?.title} created `,
      blogId: newBlog?._id?.toString()
    });
  }
  return res.status(400).json({ status: "error", message: "An error occured" });
}); 


const GetBlogs = asyncHandler(async (req, res) => {
  const { page, size } = req.query;
  const queryFilters = req.query.keyword
    ? {
      $or: [
        { title: { $regex: req.query.keyword, $options: "i" } },
        { content: { $regex: req.query.keyword, $options: "i" } },
        { tags: { $regex: req.query.keyword, $options: "i" } },
       
      ],
    }
    : {}

  const blogs = await BlogModel.find({ ...queryFilters })
    .sort({ created_at: -1, publish: -1, })
    .populate({ path: 'author', select: `-password` })
    .populate({ path: 'publisher', select: `-password` })
    .populate({ path: 'likes.user', select: `-password` })
    .skip(+page * +size).limit(+size)
    .lean().exec();
  
  const blogsWithNotification = await Promise.all(blogs?.map(async (blog) => {
    const notification = await Notification.findOne({ modelname: 'blog', model: blog?._id })
      .populate({ path: 'user', select: '-password' })
      .lean().exec()
    return {...blog, notification}
}))
 
  const total = await BlogModel.countDocuments({...queryFilters});
  const pageCount = Math.ceil(+total / +size)
  return res.json({
    status: "success",
    blogs: blogsWithNotification,
    total: +total,
    pageCount: +pageCount,
    size: +size,
    page: +page,
  });
});

const GetUsersBlogs = asyncHandler(async (req, res) => {
  const page = req.query.page || req.params.page;
  const size = req.query.size || req.params.size;
  const user = req.query.user || req.params.user;
  
  const blogs = await BlogModel.find({author:user})
  .sort({ created_at: -1, publish: -1 })
    .populate({ path: 'author', select: `-password` })
    .populate({ path: 'publisher', select: `-password` })
    .populate({ path: 'likes.user', select: `-password` })
    .skip(+page * +size).limit(+size)
    .lean().exec();
  
    
  const total = await BlogModel.countDocuments({author:user});
  const pageCount = Math.ceil(+total / +size)
  return res.json({
    status: "success",
    blogs, total, pageCount, size, page,
  });
});


// get blogs by searching blogs
const GetBlogsInfinitely = asyncHandler(async (req, res) => {
  // const {  offset } = req.query;
  const page = req.query.page;
  const size = req.query.size || 10;
  const offset = req.query.offset || 10;
  const keyword = req.query.keyword || req.params.keyword;

  let filters = keyword?.length ? {
   $or: [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
        { tags: { $regex: keyword, $options: "i" } },
      ],
  } : {}
  
  const blogs = await BlogModel.find({publish:true, ...filters})
    .sort({
      created_at:-1,
 })
    .populate({ path: 'author', select: `-password` })
    .populate({ path: 'publisher', select: `-password` })
    .skip(+offset)
    .limit(+size)
    .lean().exec();
;

  const total = await BlogModel.countDocuments({publish:true, ...filters});
  const pageCount = Math.ceil(total / +size);
  const offsetValue = Number(size) + Number(offset);
  // const offsetValue = Number(size) + Number(offset);
  
  return res.json({
    status: "success",
    blogs,
    total,
    pageCount,
    size:+size,
    page:+page,
    offset: +offsetValue,
  });
});

const GetSearchBlogsInfinitely = asyncHandler(async (req, res) => {
  // const {  offset } = req.query;
  const page = req.query.page;
  const size = req.query.size || 10;
  const offset = req.query.offset || 10;
  const keyword = req.query.keyword || req.params.keyword;

  let  filters= keyword?.length? {
   $or: [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
        { tags: { $regex: keyword, $options: "i" } },
      ],
  } : {}
  
  const blogs = await BlogModel.find({publish:true, ...filters})
    .sort({
      created_at:-1,
 })
    .populate({ path: 'author', select: `-password` })
    .populate({ path: 'publisher', select: `-password` })
    .skip(+offset)
    .limit(+size)
        .lean().exec();
;

  const total = await BlogModel.countDocuments({publish:true, ...filters});
  const pageCount = Math.ceil(total / +size);
  const offsetValue = Number(size) + Number(offset);
  // const offsetValue = Number(size) + Number(offset);
  
  return res.json({
    status: "success",
    blogs,
    total,
    pageCount,
    size:+size,
    page:+page,
    offset: +offsetValue,
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
  const blog = await BlogModel.findById(id)
    .populate({ path: 'author', select: `-password` })
    .populate({ path: 'publisher', select: `-password` })
    .populate({ path: 'likes.user', select: `-password` })
    .lean().exec();
  
  if (!blog) return res.status(400).json({ message: `blog was not found` })

  const notification = await Notification.findOne({model:blog?.id}).lean().exec()
  
  return res.json({ blog: {...blog, notification} });
});

const GetSingleBlogByTitle = asyncHandler(async (req, res) => {
  const { title } = req.query;
  let formattedTitle = title?.replace(/[-]/g, " ")
  // title?.split('%').join('/')

  const blog = await BlogModel.findOne({ title: formattedTitle }, {}, { collation: { strength: 1, locale: 'en' } })
    .populate({ path: 'author', select: `-password` })
    .populate({ path: 'publisher', select: `-password` })
    .populate({ path: 'likes.user', select: `-password` })
    .lean().exec();
  if (!blog)
  {
    return res.status(400).json({ message: `blog was not found` })
  }

  const notification = await Notification.findOne({model:blog?.id}).lean().exec()
  return res.json({ blog: {...blog, notification} });
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


// @private http patch for admins
// change blog publish status
const ToggleBlogPublished = asyncHandler(async (req, res) => {

  const id = req.params.id;
  const username = req.user;
  const date = req.query.date || req.params?.date;
  if (!username) {
    return res.status(400).json({ message: 'Unathorized access',status:'error' });
  }
  const userObj = await user.findOne({ username }).lean().exec()
    if (!userObj) {
    return res.status(400).json({ message: 'Unathorized account',status:'error' });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'invalid params',status:'error' });
  }
  const blog = await BlogModel.findById(id).lean().exec()
  if(!blog) return res.sendStatus(400).json({message:`Blog not found`})
  await BlogModel.findByIdAndUpdate(id, {
    publish: !blog?.publish,
    publish_date: !blog.publish ? date : '',
    publisher: !blog?.publish ? userObj?._id : null
  }).exec();
  
   const userNotification = {
        message: `${blog?.title} ${!blog?.publish? "published":"unpublished"}`,
        model: id,user:userObj?._id,date: date,
     modelname: 'blog', for: 'user',
        target_user:blog?.author
  }
  await Notification.create({ ...userNotification })
  
   const newBlogData = await BlogModel.findById(id)
      .populate({ path: 'author', select: `-password` })
      .populate({ path: 'publisher', select: `-password` })
    .lean().exec()
  
  return res.json({
    message: `blog ${blog?.publish ? 'unpublished' : 'published'}`, status: 'success',
  blog:newBlogData});

})

// @private http get for admins
const GetDashBoardStatistics = asyncHandler(async (req, res) => {
  const blogCount = await BlogModel.count()
  const recentDate = new Date(new Date().getFullYear(),
  new Date().getMonth(), new Date().getDate()-2).toUTCString()

  const recentUsers = await user.find().select('-password').limit(10)
  const editorCount = await user.countDocuments({ role: 'editor' })
  
  const adminCount = await user.countDocuments({ role: 'admin' })
  const normalUserCount = await user.countDocuments({role:'user'})
  const subscribersCount = await user.countDocuments()
  
  return res.json({
    recentUsers,
    blogCount, editorCount, normalUserCount, adminCount, subscribersCount
  })
})

const RefetchUnPublishBlogs = asyncHandler(async(req, res) => {
  const recentBlogs = await BlogModel.find({ publish: false }, {}).select('-content').populate({ path: 'author', select: '-password' }).sort({ created_at: -1, publish: -1 }).limit(10)
  const blogsWithNotification = await Promise.all(recentBlogs?.map(async (blog) => {
    const notification = await Notification.findOne({ modelname: 'blog', model: blog?._id })
      .populate({ path: 'user', select: '-password' })
      .lean().exec()
    return {...blog, notification}
}))
  return res.json({recentBlogs: blogsWithNotification})
})

// @public method
// get blogs for a specific tag
const GetTagBlogs = asyncHandler(async (req, res) => {

  const tag = req.params.tag || req.query.tag;
  const page = req.query.page || req.params.page || 0;
  const size = req.params.pageSize || req.query.pageSize || 10;
  const queryFilters = {
    $or: [
      { title: { $regex: tag, $options:'i' } },
      { tags: {$regex:tag, $options:'i'} },
    ]
  }
  const queryFilters2 = {
    $or: [{ title: { $regex: `${tag}`, $options: 'i' } },
      { tags: { $regex: `${tag}`, $options: 'i' } },
    { content: { $regex: `${tag}`, $options: 'i' } }
    ]
  }
  
  const blogs = await BlogModel.find({ ...queryFilters })
     .populate({ path: 'author', select: `-password` })
    .populate({ path: 'publisher', select: `-password` })
    .populate({ path: 'likes.user', select: `-password` })
    .skip(+page * +size).limit(+size).lean();
  const total = await BlogModel.countDocuments({...queryFilters})
  return res.json({
    blogs, page, pageSize: size,
    total
  })
})

// private method
// toggle blog like
const LikeBlog = asyncHandler(async (req, res) => {

  const id = req.params.id;
  const likeId = req.params.likeId || req.query.likeId;
  const { user, date } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'invalid params',status:'error' });
  }
  const blog = await BlogModel.findById(id).lean().exec()
  if (!blog) return res.sendStatus(400).json({ message: `Blog not found` })
  
  const existingLiked = blog?.likes?.find((like) => like?.user?.toString() === user);

  // console.log(existingLiked);
  if (existingLiked) {
    const newLikes = blog?.likes?.filter(like => like?.user?.toString() !== user);
  //  const updatedBlog = await BlogModel.findByIdAndUpdate(id, { $pull: { likes: { user: user, _id: likeId } } },
  //    { new: true }).exec()
     await BlogModel.findByIdAndUpdate(id, { $set: { likes: newLikes } },
      { new: true }).exec()
     const latest = await BlogModel.findById(id)
      .populate({ path: 'author', select: `-password` })
      .populate({ path: 'publisher', select: `-password` })
    .populate({ path: 'likes.user', select: `-password` })
 .lean().exec()
    return res.json({
      blog: latest
    })
  }
  const updatedBlog = await BlogModel.findByIdAndUpdate(id,
    { $push: { likes: { user: user, date } } },
    { new: true }).exec()
    const latest = await BlogModel.findById(id)
     .populate({ path: 'author', select: `-password` })
    .populate({ path: 'likes.user', select: `-password` })
 .lean().exec()
  
    return res.json({
      blog: latest
    })

  // return res.json({ message: `blog ${blog?.publish? 'unpublished':'published'}`, status:'success' });

})


// @private method
// updating blog
const UserUpdateBlog = asyncHandler(async (req, res) => {
  const id = req.query.blog || req.params.blog;
  const {title, image, content, tags,} = req.body;
if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'invalid params',status:'error' });
  }
  const blog = await BlogModel.findById(id).lean().exec()
  if (!blog) return res.sendStatus(400).json({ message: `Blog not found` })

  await BlogModel.findByIdAndUpdate(id, {
    title, image, content, $set:{tags:tags},
  }, { new: true }).exec()
  
  return res.json({message:`Blog updated`})
})


// @private method
// users blogs data statistics
const GetUserDashboardData = asyncHandler(async (req, res) => {
  const userId = req.query.user || req.params.user;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      status:'error',
      message: `unauthorized user`
    })
  }
  

  const totalBlogsCount = await BlogModel.countDocuments({ author: userId }) 
  const PublishBlogsCount = await BlogModel.countDocuments({ author: userId, publish:true }) 
  const UnPublishBlogsCount = await BlogModel.countDocuments({ author: userId, publish:false }) 
  const blogs = await BlogModel.find({ author: userId }).select('title publish').lean().exec() 
  const likedBlogCount = await BlogModel.countDocuments({ 'likes.user': userId })
  const likeBlogs = await BlogModel.find({'likes.user': userId}).select('title publish').lean().exec()

  return res.json({
    blogCount: totalBlogsCount,
    publishCount: PublishBlogsCount,
    notPublishCount:UnPublishBlogsCount,
    likedBlogCount,
    likeBlogs,
    blogs,
  })
})


// public 
// get blogs for an author
const GetAuthorsBlogs = asyncHandler(async (req, res) => {
  const authorName = req.query.name || req.params.name;
  const page = req.query.page || req.params.page
  const size = req.query.size || req.params.size
  if (!authorName) return res.status(400).json({ message: 'invalid data' })
  
  const author = await user.findOne({ public_name: authorName }).lean().exec();

  if (!author) return res.json({ message: 'author found' })
  
  const blogs = await BlogModel.find({ author: author?._id })
     .populate({ path: 'author', select: `-password` })
    .populate({ path: 'publisher', select: `-password` })
    .populate({ path: 'likes.user', select: `-password` })
      .skip(+page * +size).limit(+size).lean().exec()
    
  const total = await BlogModel.countDocuments({author: author?._id})
  return res.json({
    blogs,total, page: +page, size: +size
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
  RefetchUnPublishBlogs,
  GetTagBlogs, GetBlogsInfinitely,
  LikeBlog,
  GetUsersBlogs,
  GetUserDashboardData,
  UserUpdateBlog,
  GetAuthorsBlogs
};
