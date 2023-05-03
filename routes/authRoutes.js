const express = require('express')
const router = express.Router()
const {Login, Logout,getRefreshToken} = require('../controllers/authController')



router.route('/').post(Login)
router.route('/').put(Logout)
router.route('/').get(getRefreshToken)

module.exports = router;