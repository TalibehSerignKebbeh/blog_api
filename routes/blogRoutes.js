const express = require('express')
const router = express.Router()
const upload = require('../middlewares/upload')

const { PostBlog, GetBlogs, DeleteBlog,
    SetBlogImage, GetSingleBlogById, GetSingleBlogByTitle,
    GetDashBoardStatistics, UpdateBlog,
    ToggleBlogPublished,
    RefetchRecentBlogs, 
    GetTagBlogs} = require('../controllers/blogController')
const { VerifyJwt } = require('../middlewares/VerifyJwt')



router.route('/')
    .get(GetBlogs)

router.route('/single')
    .get(GetSingleBlogByTitle)
router.route('/tags/:tag',GetTagBlogs )
router.use(VerifyJwt)

router.route('/').post(upload.single('image'), PostBlog)
router.route('/stats').get(GetDashBoardStatistics)
router.route('/stats/recent').get(RefetchRecentBlogs)

router.route('/:id')
    .get(GetSingleBlogById)
    .post(SetBlogImage)
    .delete(DeleteBlog)
    .put(UpdateBlog)
    .patch(ToggleBlogPublished)


module.exports = router
