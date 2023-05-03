const asyncHandler = require('express-async-handler');
const Comment = require('../models/Comment');
const user = require('../models/user');
const mongoose =require('mongoose')

// Fetch comments for a single blog
const GetCommentsForBlog = asyncHandler(async (req, res) => {
  const { id, page, limit } = req.params;
  console.log(id, page, limit);
  const comments = await Comment.find({ blog:id,IsReply:false}, {},{populate:{path:'user', select:'-password'}}).sort({ createdAt: -1 }).skip(+(page-1) * +limit).limit(+limit).exec();
  return res.json({comments});
});

// Fetch comments for a single user
const GetCommentsForUser = asyncHandler(async (req, res) => {
  const { userId, page, limit } = req.query;
 
  const comments = await Comment.find({ user:userId}, {},{populate:{path:'blog', select:'title'}}).sort({ createdAt: -1 }).skip(+(page-1) * +limit).limit(+limit).exec();
  return res.json({comments});
});

// Fetch all comments
const GetAllComments = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
      const comments = await Comment.find({}, {}, {}).sort({ createdAt: -1 })
        .skip(+(page - 1) * +limit).limit(+limit)
        .populate({path:'blog', select:'title'}).populate({path:'user', select:'-password '}).populate({path:'replies'},{}).exec();
  return res.json({comments});
});

const LikeComment = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const username = req.user;
  const TheUser = await user.findOne({ username }).exec()
  
  if (!TheUser) {
    return res.status(400).json({ message: 'unauthorized',status:'error' });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'invalid params',status:'error' });
  }
  const comment = await Comment.findById(id).exec()
  if (!comment) {
    return res.status(400).json({ message: 'comment not found',status:'error' });
  }
  const updated = await Comment.findByIdAndUpdate(id, { $push: { likes: TheUser?.id } })
  return res.json({message:`comment add successfully`})
});
const PostComment = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const blogId = req.params.id;
   const username = req.user;
   
  const TheUser = await user.findOne({ username }).exec()
  
  if (!TheUser) {
    return res.status(400).json({ message: 'unauthorized',status:'error' });
  }
  if (!message) {
    return res.status(400).json({message:`comment message body required`})
  }
   if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return res.status(400).json({ message: 'invalid blod id',status:'error' });
  }

  const newComment = await Comment.create({
    message, user: TheUser.id, blog: blogId,
  })
  if (newComment) {
    return res.json({message:`comment saved successfully`})
  }
  return res.status(400).json({message:`something went wrong`})
  });
module.exports = {
  GetCommentsForBlog,
  GetCommentsForUser,
  GetAllComments,
  PostComment, LikeComment
};
