const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'blogs',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'bloguser',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    IsReply: {
      type: Boolean,
      default: false
    },
     replies: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'BlogComment',
      required: false
    },
    reacts: {
      type: Map,
      of: Number,
      default: {}
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'bloguser',
    },
   
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlogComment', commentSchema);
