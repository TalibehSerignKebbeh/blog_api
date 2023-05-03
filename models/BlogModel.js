const mongoose = require('mongoose')


const blogSchema = mongoose.Schema({
    author: { type: mongoose.Types.ObjectId, required: false,ref:'bloguser' },
    image:{type: String, required: false},
    likes:{type: [mongoose.Types.ObjectId], required: false},
    category: { type: mongoose.Types.ObjectId, required: false },
    title: { type: String, required: false },
    publish:{type: Boolean, default:false},
    content: {
        type:String, required:false,
    },
    tags: { type: [String], default: [] },
    created_at: {
        type: Date,
        default: Date.now,
    },
     created_timezoneOffset: {
         type: Number,
        default: new Date().getTimezoneOffset(),
    },
     updated_at: {
        type: Date, default: Date.now,
    },
     updated_timezoneOffset: {
    type: Number,
            default: new Date().getTimezoneOffset(),

  },
})


module.exports = mongoose.model('blogs', blogSchema)