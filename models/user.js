const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firstName: {
    type: String,
    required: true,
    unique: false,
    },
    lastName: {
    type: String,
    required: true,
    unique: false,
  },
     public_name: {
    type: String,
    required: false,
    unique: true,
  },
      status: {
    type: String,
        required: false,
    default:'active'
  },
  username: {
    type: String,
    required: true,
    unique: true,
    
  },
   email: {
    type: String,
    required: false,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    },
   profile: {
    type: String,
    required: false,
  },
   active: {
    type: Boolean,
    default: false,
    },
    role: {
      type: String,
    default: 'user'
  },
     verifyToken: {
    type: String,
    required: false,
    
  },
  created_date: {
    type: Date,
    default: Date.now,
  },
  updated_date: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps:true,
});

// userSchema.virtual('fullname', {
//   getters(data) {
  
// }})

userSchema.pre('save', async function (next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
    next();
  } catch (error) {
    next(error);
  }
});


userSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('bloguser', userSchema);