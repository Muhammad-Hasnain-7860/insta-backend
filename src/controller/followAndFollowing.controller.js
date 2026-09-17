const UserModel = require("../model/user.model");

const follow = async (req, res) => {
  const followUserId = req.params.id;

  const user = req.user

  if (!followUserId) {
   return res.status(400).json({
      success : false,
      message : 'Not information provided'
    })

  }


  const foundFollowUser = await UserModel.findById(followUserId);

  if (!foundFollowUser) {
    res.status(404).json({
      success : false,
      message : 'follow user not found'
    })
    return;
  }

  // already check
  const alreadyFollowUser = user.followingUsers.find((f) => {
    return f._id.toString() === followUserId;
  });

  if(alreadyFollowUser) {
    return res.status(409).json({
      success : false,
      message : 'already Following',
    });
  }

  // update

  // following user update
  await UserModel.findOneAndUpdate(
    {
      _id: user._id,
    },

    {
      $push: {
        followingUsers: foundFollowUser,
      },

      $inc: {
        following: 1,
      },
    },
  );

  // follow user update
  await UserModel.findByIdAndUpdate(followUserId, {
    $push: {
      followersUsers: user,
    },
    $inc: {
      followers: 1,
    },
  });

  res.status(200).json({
    success: true,
    message : 'Follow...'
  });
};

const unFollow = async (req, res) => {
  const followUserId = req.params.id;
  const user = req.user 

  if (!followUserId) {
    return res.status(400).json({
      success : false,
      message : 'not information provided',
    })
  }

  
  const foundFollowUser = await UserModel.findById(followUserId);

  console.log(foundFollowUser , 'follow user....')

  if (!foundFollowUser) {
    res.status(404).json({
      success : false,
      message : 'follow user not found',
    })
    return;
  }

  // checking

  const checkUser = user.followingUsers.find((f) => {
    return f._id.toString() === followUserId;
  });

  const checkFollowUser = foundFollowUser.followersUsers.find((f) => {
    return f._id.toString() === user._id.toString();
  });

  console.log(checkUser)
  console.log(checkFollowUser)

  if (!checkUser || !checkFollowUser) {
    return res.status(404).json({
      message : 'not found',
      success : false,
    }) 
  }

  // user update
  await UserModel.findByIdAndUpdate(user._id, {
    $inc: {
      following: -1,
    },
    $pull: {
      followingUsers: checkUser,
    },
  });

  // follow user update

  await UserModel.findByIdAndUpdate(followUserId, {
    $inc: {
      followers: -1,
    },

    $pull: {
      followersUsers: checkFollowUser,
    },
  });

  res.status(200).json({
    success : true,
    message : 'un follow...'
  });
};

module.exports = {
  follow,
  unFollow,
};
