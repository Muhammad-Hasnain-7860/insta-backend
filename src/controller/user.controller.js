const imagekit = require("../services/imagekit.service");
const UserModel = require("../model/user.model");
const bcrypt = require("bcrypt");

const {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToke,
} = require("../utils/auth.utils");

const registerUser = async (req, res) => {
  const { username, password, email, bio, name } = req.body;
  const file = req.file;

  if (!username || !email || !password || !file || !name) {
    return res.status(400).json({
      message: "Please fill in all required fields.",
    });
  }

  const alreadyUserExists = await UserModel.findOne({email: email})

  if (alreadyUserExists) {
    return res.status(409).json({
      message: " email already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const uploadFile = await imagekit.upload({
    file: file.buffer,
    fileName: file.originalname,
    folder: "uploads",
  });

  // create User

  const user = {
    name,
    username,
    password: hashedPassword,
    email,
    profilePic: uploadFile.url,
    followers: 0,
    following: 0,
    bio: bio,
    posts: [],
    notification: [],
    followersUsers: [],
    followingUsers: [],
  };

  // token generate

  const data = await UserModel.create(user);

  const { accessToken, refreshToken } = generateTokens(data._id);

  data.refreshToken = refreshToken;
  await data.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    message: "User Created SuccessFully",
    data: {
      user: user,
    },
    token: accessToken,
  });
};

const getMe = async (req, res) => {
  const user = req.user;

  return res.status(200).json({
    message: "user fetched SuccessFully",
    data: {
      user: user,
    },
  });
};

const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({
      message: "UnAuthorize User",
    });
  }

  try {
    const decode = verifyRefreshToke(token);
    const user = await UserModel.findById(decode.id);

    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }

    if (user.refreshToken !== token) {
      return res.status(400).json({
        message: "mismatch refreshToken",
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "token refresh SuccessFully",
      token: accessToken,
    });
  } catch {
    return res.status(401).json({
      message: "expire & invalid refresh Token",
    });
  }
};

const getallUsers = async (req, res) => {
  const users = await UserModel.find().select("_id name username profilePic");

  res.status(200).json({
    message: "all users fetched successFully",
    data: {
      users: users,
    },
  });
};

const login = async (req , res) => {
    const {email , password} = req.body

    if(!email || !password){
      return res.status(400).json({
        message : 'all fields are Required'
      })
    }

    // check 

    const user = await UserModel.findOne({
      email : email 
    },
    )

    if(!user){
      return res.status(404).json({
        message : 'user not found'
      })
    }

    const checkPass = bcrypt.compare(password , user.password)

    if(!checkPass){
     return res.status(400).json({
        message : 'invalid email or password'
      })
    }

    // generate token 

    const {accessToken , refreshToken} = generateTokens(user._id)


    user.refreshToken = refreshToken
    await user.save()

    res.cookie('refreshToken' ,refreshToken , {
      httpOnly : true
    })

    res.status(200).json({
      message : 'user fetched successFully',
      data : {
        user : user
      },
      token : accessToken
    })
}

module.exports = {
  registerUser,
  refresh,
  getMe,
  getallUsers,
  login
};
