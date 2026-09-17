const { default: mongoose, mongo } = require("mongoose");

const userSchema = new mongoose.Schema({
    name : {
        required: true,
        type : String,
        minlength : [3, 'minium 3 character are Required']
    },
    username : {
        type : String,
        unique : [true , 'username must be Unique'],
        required : [true , 'username is Required'],
        minlength : [3 , 'Minium 3 character are Required']
    },

    email : {
        type : String,
        unique : [true , 'email must be Unique'],
        required : [true , 'Email is Required'],
        match : /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        lowercase : true,
    },

    password : {
        type : String,
        required : [true , 'Password is Required'],
        minlength : [6 , 'Minium 6 character are Required'],
    },

    profilePic : {
        type : String,
        required : [true , 'ProfilePic is Required'],
    },

    bio : {
        type : String,
        minlength : [true , 'Minium 40 character are Required'],
        maxLength : [true , 'Maximum 1000 character are Required'],
    },

    followers : {
        type : Number,
    },

    following : {
        type : Number,
    },

    followersUsers : [],
    followingUsers : [],

    posts : {
        type : [],
    },

    notification : {
        type : [],
    },
    refreshToken : {
        type : String,
    }
})

const UserModel = mongoose.model('user' , userSchema)

module.exports = UserModel