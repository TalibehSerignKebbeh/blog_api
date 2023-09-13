const mongoose = require('mongoose')

const notificationSchema = mongoose.Schema({
    message: {
        type: String,
        required:true,
    },
    model: {
         type: mongoose.Types.ObjectId,
    },
    read: {
        type: Boolean,
        default:false,
    },
     user: {
         type: mongoose.Types.ObjectId,
         required: false, ref: 'bloguser',
         default: null
    },
     target_user: {
         type: mongoose.Types.ObjectId,
         required: false, ref: 'bloguser',
         default: null
    },
      read_user: {
         type: mongoose.Types.ObjectId,
          required: false, ref: 'bloguser',
          default: null
    },
    modelname: {
        type: String,
        required:true,
    },
    for: {
        type: String,
        required:true,
    },
    date: {
        type: Date,
        default: Date.now
    },
    read_date: {
        type: Date,
        
    }

},{timestamps:true})


module.exports = mongoose.model('notification', notificationSchema)
