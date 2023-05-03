const express = require('express')

const { GetAllComments, GetCommentsForBlog, GetCommentsForUser, PostComment } = require('../controllers/commentController')
const { VerifyJwt } = require('../middlewares/VerifyJwt')

const router = express.Router()

router.route('/').get(GetAllComments)
router.use(VerifyJwt)
router.route('/blog/:id').
    get(GetCommentsForBlog)
    .post(PostComment)
router.route('/user/:id').get(GetCommentsForBlog)


module.exports = router;