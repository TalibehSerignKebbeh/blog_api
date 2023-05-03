const express = require('express');
const { CreateAccount, DeletAccount, GetAccounts } = require('../controllers/userController');
const {VerifyJwt} = require('../middlewares/VerifyJwt')

const router = express.Router()

router.route('/').post(CreateAccount)
router.use(VerifyJwt)
router.route('/').get(GetAccounts)
router.route('/:id').delete(DeletAccount)

module.exports = router;