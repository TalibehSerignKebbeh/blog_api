const express = require('express')

const { GetAllComments, GetCommentsForBlog,
    GetCommentsForUser, PostComment,
LikeComment} = require('../controllers/commentController')
const { VerifyJwt } = require('../middlewares/VerifyJwt')

const router = express.Router()

router.route('/').get(GetAllComments)
router.route('/:id').patch(VerifyJwt, LikeComment)
router.route('/blog/:id').
    get(GetCommentsForBlog)
    .post(VerifyJwt, PostComment)
// router.route('')
  
router.route('/user/:id').get(VerifyJwt, GetCommentsForUser)


module.exports = router;