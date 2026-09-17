const { default: mongoose } = require("mongoose");

const postScheme = mongoose.Schema({
    user:{
        required : true,
        type : {},
    },

    description : {
        type : String,
        minlength : [20 , 'Minium 20 character are Required'],
        maxLength : [120 , 'Maximum 120 character are Required'],
        required : [true , 'Description are Required']
    },

    images : {
        type : [],
    },


    likes : {
        type : Number,
    },

    totalLikes : {
        type : [],
    },

    comment : {
        type : Number,
    },

    totalComments : {
        type : []
    },

    replay : {
        type: []
    }
},{
    timestamps : true
})

const PostModel = mongoose.model('post' , postScheme)

module.exports = PostModel