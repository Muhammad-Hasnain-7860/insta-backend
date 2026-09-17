const express = require('express')
const { registerUser, getMe, refresh, getallUsers, login } = require('../controller/user.controller')
const uploads = require('../config/multer')
const authMiddleWare = require('../middleware/auth.middleware')

const authRouter = express.Router()

authRouter.post('/register', uploads.single('profilePic') , registerUser)
authRouter.get('/me' , authMiddleWare , getMe)
authRouter.post('/refresh-token' , refresh)
authRouter.get('/' , getallUsers)
authRouter.post('/login' , login)

module.exports = authRouter