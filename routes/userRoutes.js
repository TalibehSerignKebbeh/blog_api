const express = require('express');
const { CreateAccount, DeletAccount, GetAccounts, DeactivateAccount, GetProfile, UpdateProfile } = require('../controllers/userController');
const {VerifyJwt} = require('../middlewares/VerifyJwt')
const upload = require('../middlewares/upload');
const router = express.Router()

router.route('/').post(upload.single('profile'), CreateAccount)
router.route('/').get(GetAccounts)
router.use(VerifyJwt)
router.route('/:id')
    .get(GetProfile)
    .put(VerifyJwt, upload.single('profile'), UpdateProfile)
    .delete(DeletAccount)
    .patch(DeactivateAccount)


module.exports = router;