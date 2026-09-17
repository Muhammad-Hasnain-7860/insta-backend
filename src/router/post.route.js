const { postCreate, postLike, postComment, postReplay, postDelete, postEdit, postCommentEdit, postReplayUpdate, allPosts, commentDelete, replayDelete } = require("../controller/post.controller");
const uploads = require('../config/multer');
const express = require('express');
const postMiddleWare = require("../middleware/postMiddleWare");
const authMiddleWare = require("../middleware/auth.middleware");
const postRouter = express.Router();

postRouter.post("/create", uploads.array('images'), authMiddleWare, postCreate);
postRouter.post('/like/:id', authMiddleWare , postMiddleWare, postLike)
postRouter.post('/comment/:id',authMiddleWare,postMiddleWare,postComment)
postRouter.post('/replay/:id' , authMiddleWare , postMiddleWare, postReplay)
postRouter.delete('/:id', authMiddleWare , postMiddleWare, postDelete)
postRouter.put('/postEdit/:id', uploads.array('newImages'), authMiddleWare, postMiddleWare, postEdit)
postRouter.put('/comment/:id', authMiddleWare ,  postMiddleWare, postCommentEdit)
postRouter.put('/replay/:id',authMiddleWare, postMiddleWare, postReplayUpdate)
postRouter.get('/', authMiddleWare ,allPosts)
postRouter.delete('/commentdel/:id' , authMiddleWare , postMiddleWare , commentDelete)
postRouter.delete('/replaydel/:id' , authMiddleWare , postMiddleWare , replayDelete)
module.exports = postRouter
