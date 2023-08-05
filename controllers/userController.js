const { default: mongoose } = require('mongoose');
const { convertBase64ToFile } = require('../config/saveImage');
const User = require('../models/user')
const asyncHandler = require('express-async-handler')
const { v4: uuidv4 } = require("uuid");


const CreateAccount = asyncHandler(async (req, res) => {
  const { firstName, lastName, username, name, password, profile, role } = req.body;
  // console.log(req.body);
  // console.log(req?.files);
  console.log(req?.file);
  // return res.json({message: 'testing'})
    if (!username || !password || !firstName || !lastName ) {
      return res.status(400).json(
        {
          message: `all fields are required`,
        })
    }
    const duplicate =await User.findOne({ username }, {}, { collation: { strength: 1, locale: 'en' } }).exec()
    if (duplicate) {
        // console.log(duplicate);
      return res.status(400).json({
        status: 'error',
        message: `username already exist`,
        errors:{username: `username already exist`}
      })
    }
  //   let imageName = '';
  //   if (profile) {
  //       imageName = `${uuidv4()}.png`;
  // convertBase64ToFile(
  //   profile,
  //   path.join(__dirname, "..", "images", imageName)
  //   );
  // }
  // const tempNewUser = new User({ firstName, lastName,name, username, password, role: role || 'user', profile: imageName })
  
  // const newUser = await User.create({ firstName, lastName,name, username, password, role: role || 'user', profile: imageName })
  const newUser = await User.create({
    firstName,
    lastName, name, username,
    password, role: role || 'user',
    profile: req.file.filename || ''
  })
    .then(() => {
    return res.json({message: `account created successfully`})
      
    }).catch((errors) => {
      return res.status(400).json({
        errors,
        status: 'error',
        message:'unpected error occured during creating user'
      })
    })
  if (newUser) {
    return res.json({message: `user created successfully`})
      
    }
    // console.log(newUser);
    return res.json({message: `check console`})

})


const DeletAccount = asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({message: `bad request params`})
    }

    const deletedUser = await User.findByIdAndDelete(id).exec()
    if (deletedUser) return res.json({ message: `account deleted` })
    return res.status(400).json({message: `bad request data`})
})

const GetAccounts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSizeNumber) || Number(req.params.pageSizeNumber)
   // number of items per page
  const page = Number(req.query.pageNumber) ||Number(req.params.pageNumber) || 1 // current page number, default to page 1
  const keyword = req.query.keyword
    ? {
        $or: [
          { firstName: { $regex: req.query.keyword, $options: "i" } },
          { lastName: { $regex: req.query.keyword, $options: "i" } },
        { username: { $regex: req.query.keyword, $options: "i" } },
          { name: { $regex: req.query.keyword, $options: "i" } },
        ],
      }
    : {}

  const count = await User.countDocuments({ ...keyword }) // count total number of items based on search criteria
  const users = await User.find({ ...keyword }, {},).select('-password')
    .limit(pageSize)
    .skip(pageSize * (page)) // paginate the results
    .exec()

  return res.json({ users, page,count, pages: Math.ceil(count / pageSize) })
})



module.exports = {
    CreateAccount,
    DeletAccount,
    GetAccounts,
}