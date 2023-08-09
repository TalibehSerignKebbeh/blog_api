const express = require('express')
const router = express.Router()
const upload = require('../middlewares/upload')

const { PostBlog, GetBlogs, DeleteBlog,
    SetBlogImage, GetSingleBlogById, GetSingleBlogByTitle,
    GetDashBoardStatistics, UpdateBlog,
    ToggleBlogPublished,
    RefetchRecentBlogs, 
    GetTagBlogs,
    GetBlogsInfinitely} = require('../controllers/blogController')
const { VerifyJwt } = require('../middlewares/VerifyJwt')



router.route('/')
    .get(GetBlogs)

router.route('/infinite').get(GetBlogsInfinitely)
router.route('/single')
    .get(GetSingleBlogByTitle)
router.route('/tags/:tag').get(GetTagBlogs)


router.route('/').post(VerifyJwt,upload.single('image'), PostBlog)
router.route('/stats').get(VerifyJwt,GetDashBoardStatistics)
router.route('/stats/recent').get(VerifyJwt,RefetchRecentBlogs)

router.route('/:id')
    .get(GetSingleBlogById)
    .post(VerifyJwt, SetBlogImage)
    .delete(VerifyJwt, DeleteBlog)
    .put(VerifyJwt, UpdateBlog)
    .patch(VerifyJwt, ToggleBlogPublished)


module.exports = router
