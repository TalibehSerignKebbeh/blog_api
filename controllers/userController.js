const { default: mongoose } = require('mongoose');
const { convertBase64ToFile } = require('../config/saveImage');
const User = require('../models/user')
const asyncHandler = require('express-async-handler')
const { v4: uuidv4 } = require("uuid");
const { validateEmptyOrNull, passwordRegex, usernameRegex, usernameErrorMessage, passwordErrorMessage, validateUsername, validateEmail } = require('../config/keyMethods');
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const {DefinedStatus, AllowedRoles} = require('../config/configValues');
const Notification = require('../models/Notification');

const CreateAccount = asyncHandler(async (req, res) => {
  const { firstName, lastName,
    username, name, password,
    role, email, date } = req.body;
 
  

  let errors = {};
  if (!validateEmptyOrNull(username) ||
    !validateEmptyOrNull(password) ||
    !validateEmptyOrNull(firstName)
    || !validateEmptyOrNull(lastName)
  ) {

    if (!validateEmptyOrNull(username)) {
      errors = { ...errors, username: 'username is required' }
    } else {
      if (!usernameRegex.test(username)) {
        errors = {
          ...errors,
          username: usernameErrorMessage
        }

      }
    }
    if (!validateEmptyOrNull(password)) {
      errors = { ...errors, password: 'password is required' }
    } else {

      if (!passwordRegex.test(password)) {
        errors = { ...errors, password: passwordErrorMessage }
      }
    }
    if (!validateEmptyOrNull(firstName)) {
      errors = { ...errors, firstName: 'firstname is required' }
    }
    if (!validateEmptyOrNull(lastName)) {
      errors = { ...errors, lastName: 'lastname is required' }
    }
    // if (!validateEmptyOrNull(email)) {
    //   errors = { ...errors, email: 'email is required' }
    // }
      return res.status(400).json(
        {status:'error',
          message: `all fields are required`,
          errors:errors,
        })
    }

  // check if there is username
  const duplicate = await User.findOne({ username: username }, {}, { collation: { strength: 1, locale: 'en' } }).lean().exec()
  console.log(`duplicate username check`, duplicate);
  errors = {};
  if (duplicate) errors = { ...errors, username: `username already exist` }
  if (duplicate) {
    return res.status(400).json({
      status: 'error',
      message: `username already exist`,
      errors: errors,
    })
  }

  // check if there is email then verify it
  if (!validateEmptyOrNull(email)) {
    console.log(email);
  const duplicateEmail = await User.findOne({ email: email }).lean().exec()
  if (duplicateEmail) errors = { ...errors, email: `email already in use` }
  if (duplicateEmail) {
    // console.log(duplicate);
    return res.status(400).json({
      status: 'error',
      message: `email already exist`,
      errors: errors,
    })
    }
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

  // if account created and email then send verification email
  if (newUser  && !validateEmptyOrNull(email)) {
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
    await Notification.create({
      message: `a user with username ${newUser?.username} registered`,
      date: date || Date.now(),
      model: null,
      user: newUser?.id,
      modelname: AllowedRoles.user,
      for: AllowedRoles.admin
    })
    // return res.json({message: `user created successfully`})
    return res.json({ message: `account created successfully check your email to verify your account ` })

  }
  else if (newUser) {
    await Notification.create({
      message: `a user with username ${newUser?.username} registered`,
      date: date || Date.now(),
      model: newUser?.id,
      user: newUser?.id,
      modelname: 'user',
      for: 'admin'
    })
    return res.json({message:'account created successfully'})
  }
  else {
    return res.status(400).json({ message: `something went wrong` })
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


//private put 
// to change account's status
const ChangeAccountStatus = asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  const updatedStatus = req.body.status;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'invalid data params' })
  }
  if (!Object.values(DefinedStatus)?.includes(updatedStatus)) {
    return res.status(400).json({message:'invalid data'})
  }
  const user = await User.findById(id).lean().exec()
  if (!user) return res.status(400).json({ message: 'account not found' })

  const updatedUser =await User.findByIdAndUpdate(id,  { status: updatedStatus }, {new:true, lean:true})
  if (updatedUser) {
   
    return res.json({
      message: `account ${updatedUser?.status} successfully`,
 })
 }
})


//private patch 
// to change account's role
const ChangeUserRole = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.query.id;
  const username = req.user;
  if (!username) {
    return res.status(400).json({ message: 'unauthorized action',status:'error' })
  }
  const user = await User.findOne({ username: username }).lean().exec()
  if (!user) {
    return res.status(400).json({ message: 'unauthorized action',status:'error' })
  }
   if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'invalid data params',status:'error' })
  }

  const newRole = req.body.role;
  const date = req.body.date;

  if (!newRole || !Object.values(AllowedRoles).includes(newRole)) {
    return res.status(400).json({message:'invalid data', status:"error"})
  }

  const updatedUser = await User.findByIdAndUpdate(userId, {
    role: newRole, updated_date:date || Date.now()
  }, {new:true, lean:true, timestamps:true})
  
  if (!updatedUser) {
    return res.status(400).json({message:'data not found', status:'error'})
  }
  const newNotification = await Notification.create({
      message: `your account role was updated to ${updatedUser?.role}`,
      date: date || Date.now(),
      target_user: updatedUser?.id,
      user: user?.id,
      modelname: AllowedRoles.user,
      for: AllowedRoles.user
    })

  return res.json({
    message: "account updated successfully", status: 'success',
  notificationId: newNotification?._id})
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
  // return res.status(400).json({ message: 'testing error'})
  const pageSize = Number(req.query.pageSize) || Number(req.params.pageSize)
  // number of items per page
  const page = Number(req.query.page) || Number(req.params.page) || 0 // current page number, default to page 1
  const queryFilters = req.query.keyword
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
  const count = await User.countDocuments({ ...queryFilters }) // count total number of items based on search criteria
  const users = await User.find({ ...queryFilters }, {},)
  .select('-password')
    .limit(pageSize)
    .skip(pageSize * (page)) // paginate the results
    .exec()

  return res.json({
    users, page: +page,
    total:+count,
    count, pages: Math.ceil(count / pageSize)
  })
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
  let errors = {};
  if (!firstName) errors['firstName'] = 'firstname is required';
  if (firstName && !firstName?.length) errors['firstName'] = 'firstname cannot be empty';

  if (!lastName) errors['lastName'] = 'lastname is required';
  if (lastName && !lastName?.length) errors['lastName'] = 'lastname cannot be empty';

  if (!email) errors['email'] = 'email is required';
  if (email && !email?.length) errors['email'] = 'email cannot be empty';
  if (email && !validateEmail(email)) errors['email'] = 'email is invalid';


  if (!username) errors['username'] = 'username is required';
  if (username && !validateUsername(username, 4, 16)) errors['username'] = 'username is invalid';

  if (!public_name) errors['public_name'] = 'public name is required';
  if (public_name && !public_name?.length) errors['public_name'] = 'public name cannot be empty';
  if (public_name && !validateUsername(public_name)) errors['public_name'] = 'public name is invalid';

  if (Object.values(errors)?.length) {
     return res.status(400).json({
      status: 'error',
      errors: { ...errors }
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


const GetRecentRegisteredUsers = asyncHandler(async (req, res) => {
  
  const users = await User.find({}, {}, { lean: true }).sort({ createdAt: -1 });
  return res.json({users: users, status:'success'})
})




module.exports = {
  CreateAccount,
  DeletAccount,
  GetAccounts,
  DeactivateAccount,
  GetProfile,
  UpdateProfile, ChangeAccountStatus,
  GetRecentRegisteredUsers,
  ChangeUserRole
}


