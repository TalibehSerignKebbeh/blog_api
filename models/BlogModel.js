const mongoose = require('mongoose')


const likeSchema = mongoose.Schema({
    user: { type: mongoose.Types.ObjectId, required: false,ref:'bloguser' },
    date: {
        type: Date,
        default:  Date.now,
    }
})

const blogSchema = mongoose.Schema({
    author: { type: mongoose.Types.ObjectId, required: false,ref:'bloguser' },
    publisher: { type: mongoose.Types.ObjectId, required: false,ref:'bloguser' },
    image:{type: String, required: false},
    likes:{type: [likeSchema], required: false},
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
    publish_date: {
        type: Date,
        required:false,
    },
    
     updated_at: {
        type: Date, default: Date.now,
    },
    
})


module.exports = mongoose.model('blogs', blogSchema)