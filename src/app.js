const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const cors = require('cors')
const authRouter = require('./router/register.route')
const postRouter = require('./router/post.route')
const followersAndFollowingRoute = require('./router/followers&following.route')

app.use(express.json())
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))


app.get('/' , (req , res)=>{
    res.send('backend is Running')
})

app.use(cookieParser())

app.use('/auth', authRouter)
app.use('/post' , postRouter)
app.use('/follow' , followersAndFollowingRoute)

module.exports = app