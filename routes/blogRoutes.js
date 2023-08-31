const express = require('express')
const router = express.Router()
const upload = require('../middlewares/upload')

const { PostBlog, GetBlogs, DeleteBlog,
    SetBlogImage, GetSingleBlogById, GetSingleBlogByTitle,
    GetDashBoardStatistics, UpdateBlog,
    ToggleBlogPublished,
    RefetchUnPublishBlogs, 
    GetTagBlogs,
    GetBlogsInfinitely,
    LikeBlog,
    GetUserDashboardData,
    GetUsersBlogs,
UserUpdateBlog,
GetAuthorsBlogs} = require('../controllers/blogController')
const { VerifyJwt } = require('../middlewares/VerifyJwt')



router.route('/')
    .get(VerifyJwt,GetBlogs)

router.route('/infinite').get(GetBlogsInfinitely)
router.route('/single')
    .get(GetSingleBlogByTitle)
router.route('/tags/:tag').get(GetTagBlogs)


router.route('/').post(VerifyJwt,upload.single('image'), PostBlog)
router.route('/stats').get(VerifyJwt,GetDashBoardStatistics)
router.route('/stats/recent').get(VerifyJwt,RefetchUnPublishBlogs)
router.route('/stats/user')
    .get(VerifyJwt, GetUserDashboardData)
router.route('/user')
    .get(VerifyJwt, GetUsersBlogs)
    .put(VerifyJwt, UserUpdateBlog)
router.route('/user/:name').get(GetAuthorsBlogs)

router.route('/:id')
    .get(GetSingleBlogById)
    .post(VerifyJwt, SetBlogImage)
    .delete(VerifyJwt, DeleteBlog)
    .put(VerifyJwt, UpdateBlog)
    .patch(VerifyJwt, ToggleBlogPublished)
router.route('/:id/like').patch(VerifyJwt, LikeBlog)


module.exports = router
