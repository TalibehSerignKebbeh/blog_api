const asyncHandler = require('express-async-handler');
const Comment = require('../models/Comment');
const user = require('../models/user');
const mongoose =require('mongoose')

// Fetch comments for a single blog
const GetCommentsForBlog = asyncHandler(async (req, res) => {
  // const { limit } = req.params;
  const id = req.params.id || req.query.id;
  const page = req.params.page || req.query.page || 1;
  const limit = req.params.limit || req.query.limit || 1;
  const offset = req.query.offset || req.params.offset || 0;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({message: 'invalid id'})
  }

  // console.log(id, page, limit);
  const comments = await Comment.find({ blog: id, parent_comment: null },
    {}, { populate: { path: 'user', select: '-password' } })
    .sort({ createdAt: -1 })
    .skip(+offset).limit(+limit).lean().exec();
  
  if (!comments?.length) {
    return res.status(400).json({message:'no comments '})
  }
  const commentsWithReplyCount = await Promise.all(comments?.map( async(comment) => {
    const reply_count = await Comment.countDocuments({ parent_comment: comment?.id }).exec();
    return {...comment, reply_count}
  }))

  const total = await Comment.countDocuments({blog:id, parent_comment:null})
  return res.json({
    comments: commentsWithReplyCount,
  total:total});
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
  const id = req.params.id || req.query?.id;
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
  if (!comment?.likes?.includes(TheUser?.id)) {
    await Comment.findByIdAndUpdate(id, { $push: { likes: TheUser?.id } })
    const updatedComment = await Comment.findById(id)
      .populate({ path: 'user', select: '-password ' })
      .exec();
    
  return res.json({message:`comment liked`,
  comment: updatedComment})
  } else {
    await Comment.findByIdAndUpdate(id, { $pull: { likes: TheUser?.id } })
    const updatedComment = await Comment.findById(id)
      .populate({ path: 'user', select: '-password ' }).exec();
    

  return res.json({message:`comment unliked`,
  comment: updatedComment})
  }
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
