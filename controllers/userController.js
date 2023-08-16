const { default: mongoose } = require('mongoose');
const { convertBase64ToFile } = require('../config/saveImage');
const User = require('../models/user')
const asyncHandler = require('express-async-handler')
const { v4: uuidv4 } = require("uuid");
const { validateEmptyOrNull, passwordRegex, usernameRegex, usernameErrorMessage, passwordErrorMessage } = require('../config/keyMethods');
const nodemailer = require('nodemailer')
const crypto = require('crypto')


const CreateAccount = asyncHandler(async (req, res) => {
  const { firstName, lastName,
    username, name, password,
    role, email } = req.body;
  console.log('here create account');

  let errors = {};

  const duplicate = await User.findOne({ username: username }, {}, { collation: { strength: 1, locale: 'en' } }).lean().exec()
  console.log(`duplicate username check`, duplicate);
  errors = {};
  if (duplicate) errors = { ...errors, username: `username already exist` }
  // if(duplicateEmail) errors={...errors, email:`email already in use`}
  if (duplicate) {
    // console.log(duplicate);
    return res.status(400).json({
      status: 'error',
      message: `username already exist`,
      errors: errors,
    })
  }

  const duplicateEmail = await User.findOne({ email: email }).lean().exec()
  console.log(`duplicate email check `, duplicateEmail);

  if (duplicateEmail) errors = { ...errors, email: `email already in use` }
  if (duplicateEmail) {
    // console.log(duplicate);
    return res.status(400).json({
      status: 'error',
      message: `email already exist`,
      errors: errors,
    })
  }



  const verificationToken = crypto.randomBytes(20).toString('hex');
  console.log('creating user');
  const newUser = await User.create({
    firstName, lastName, name,
    username, password, role: role || 'user',
    profile: req.file.filename || '',
    verifyToken: verificationToken,
    email: email,
  })

  if (newUser) {
    console.log('user created, sending mail');
    let transporter = nodemailer.createTransport({
      host: process.env.ETHEREAL_MAIL_HOST,
      port: process.env.ETHEREAL_MAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.ETHEREAL_MAIL_USER, // generated ethereal user
        pass: process.env.ETHEREAL_MAIL_PASS // generated ethereal password
      }
    });
    let frontendVerifyLink = `${process.env.FRONTEND_LINK}/verifyuser/${verificationToken}`

    await transporter.sendMail({
      from: process.env.ETHEREAL_MAIL_USER,
      to: email,
      subject: 'Email Verification',
      text: `Click the following link to verify your email: ${frontendVerifyLink}`
    })
    // return res.json({message: `user created successfully`})
    return res.json({ message: `account created successfully check your email to verify your account ` })

  } else {
    return res.json({ message: `something went wrong` })
  }

})

const DeactivateAccount = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'invalid data params' })
  }
  const user = await User.findById(id).lean().exec()
  if (!user) return res.status(400).json({ message: 'account not found' })

  await User.updateOne({ _id: id }, { active: !user?.active })

  return res.json({ message: `account ${user?.active ? 'deactivated' : 'activated'}` })
})

const DeletAccount = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: `bad request params` })
  }

  const deletedUser = await User.findByIdAndDelete(id).exec()
  if (deletedUser) return res.json({ message: `account deleted` })
  return res.status(400).json({ message: `bad request data` })
})

const GetAccounts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || Number(req.params.pageSize)
  // number of items per page
  const page = Number(req.query.page) || Number(req.params.page) || 0 // current page number, default to page 1
  const keyword = req.query.keyword
    ? {
      $or: [
        { firstName: { $regex: req.query.keyword, $options: "i" } },
        { lastName: { $regex: req.query.keyword, $options: "i" } },
        { username: { $regex: req.query.keyword, $options: "i" } },
        { public_name: { $regex: req.query.keyword, $options: "i" } },
        { role: { $regex: req.query.keyword, $options: "i" } },
      ],
    }
    : {}
  const count = await User.countDocuments({ ...keyword }) // count total number of items based on search criteria
  const users = await User.find({ ...keyword }, {},).select('-password')
    .limit(pageSize)
    .skip(pageSize * (page)) // paginate the results
    .exec()

  return res.json({ users, page, count, pages: Math.ceil(count / pageSize) })
})

const GetProfile = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'invalid data parameters' })
  }

  const user = await User.findById(id).select('-password').lean().exec();
  if (!user) {
    return res.status(400).json({
      messsage: 'details not found',
      status: 'error',
    })
  }
  return res.json({
    status: 'success',
    user: user,
  })

})

const UpdateProfile = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  const { firstName, lastName,
    username, public_name, password,
    email } = req.body;


  let errors = {};


  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'invalid data parameters' })
  }

  const user = await User.findById(id).lean().exec();
  if (!user) {
    return res.status(400).json({
      status: 'error',
      message: 'account not found',
    })
  }

  const duplicate = await User.findOne({ username: username }, {}, { collation: { strength: 1, locale: 'en' } }).lean().exec()
  const duplicateEmail = await User.findOne({ email: email }).lean().exec()
  const duplicatePName = await User.findOne({ public_name: public_name }, {}, { collation: { strength: 1, locale: 'en' } }).lean().exec()

  if (duplicatePName && (duplicatePName?._id?.toString() !== id)) 
  { errors = { ...errors, public_name: `public name already in use` } }
  if (duplicate && (duplicate?._id?.toString() !== id)) 
  { errors = { ...errors, username: `username already in use` } }
  if (duplicateEmail && (duplicateEmail?._id?.toString() !== id)) 
  { errors = { ...errors, email: `email already in use` } }

  if ((duplicate && (duplicate?._id?.toString() !== id)) ||
    (duplicateEmail && (duplicateEmail?._id?.toString() !== id))
  || (duplicatePName && (duplicatePName?._id?.toString() !== id))) {
    return res.status(400).json({
      status: 'error',
      message: 'username or email already exist',
      errors: { ...errors }
    })
  }

  if (password) {
    
  const updatedProfile = await User.findByIdAndUpdate(id,
    {
      firstName, lastName, username, public_name,
      profile: req?.file?.filename || user?.profile,
      email, password,
    },
    { new: true, lean: true, }).select('-password')

  if (updatedProfile) {
    return res.json({
      status: 'success',
      message: 'profile updated ',
      user: updatedProfile
    })
    }
  } else {
    const updatedProfile = await User.findByIdAndUpdate(id,
    {
      firstName, lastName, username, public_name,
      profile: req?.file?.filename || user?.profile,
      email, 
    },
    { new: true, lean: true, }).select('-password')

  if (updatedProfile) {
    return res.json({
      status: 'success',
      message: 'profile updated ',
      user: updatedProfile
    })
    }

  }
    

  return res.status(400).json({
    status: 'error',
    message: 'update error occurred'
  })
})


module.exports = {
  CreateAccount,
  DeletAccount,
  GetAccounts,
  DeactivateAccount,
  GetProfile,
  UpdateProfile
}



// if (!validateEmptyOrNull(username) ||
  //   !validateEmptyOrNull(password) ||
  //   !validateEmptyOrNull(firstName)
  //   || !validateEmptyOrNull(lastName),
  //   !validateEmptyOrNull(email)) {

  //   if (!validateEmptyOrNull(username)) {
  //     errors = { ...errors, username: 'username is required' }
  //   } else {
  //     if (!usernameRegex.test(username)) {
  //       errors = {
  //         ...errors,
  //         username: usernameErrorMessage
  //       }

  //     }
  //   }
  //   if (!validateEmptyOrNull(password)) {
  //     errors = { ...errors, password: 'password is required' }
  //   } else {

  //     if (!passwordRegex.test(password)) {
  //       errors = { ...errors, password: passwordErrorMessage }
  //     }
  //   }
  //   if (!validateEmptyOrNull(firstName)) {
  //     errors = { ...errors, firstName: 'firstname is required' }
  //   }
  //   if (!validateEmptyOrNull(lastName)) {
  //     errors = { ...errors, lastName: 'lastname is required' }
  //   }
  //   if (!validateEmptyOrNull(email)) {
  //     errors = { ...errors, email: 'email is required' }
  //   }
  //     return res.status(400).json(
  //       {status:'error',
  //         message: `all fields are required`,
  //         errors:errors,
  //       })
  //   }