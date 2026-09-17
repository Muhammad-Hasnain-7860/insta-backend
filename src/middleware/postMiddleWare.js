const PostModel = require("../model/post.model.js")

const postMiddleWare = async(req , res , next)=>{
    const user = req.user
    const postId = req.params.id


    if(!user || !postId){
        res.status(400).json({
            message : 'not information provided',
            success : false,
        })
        return 
    }

    const foundPost = await PostModel.findById(postId)

    if(!foundPost){
        res.status(404).json({
            message : 'post not Found',
            success : false 
        })
        return 
    }

    req.post = foundPost

    next()
}

module.exports = postMiddleWare