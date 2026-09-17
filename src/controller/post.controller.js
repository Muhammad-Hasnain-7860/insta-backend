const { default: mongoose, mongo } = require("mongoose");
const imagekit = require("../services/imagekit.service");
const PostModel = require("../model/post.model");
const UserModel = require("../model/user.model");
const { nanoid } = require("nanoid");

const postCreate = async (req, res) => {
  const files = req.files;
  const postImages = [];
  const { description } = req.body;

  const user = req.user;

  if (!description || !files) {
    res.status(400).json({
      success: true,
      message: "Please fill in all required fields.",
    });
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const uploadImage = await imagekit.upload({
      file: files[i].buffer,
      fileName: files[i].originalname,
      folder: "posts",
    });

    postImages.push({ url: uploadImage.url, id: nanoid() });
  }

  const post = {
    user: {
      userId: user._id,
      name: user.name,
      username: user.username,
      profilePic: user.profilePic,
    },
    description,
    images: postImages,
    likes: 0,
    totalLikes: [],
    comment: 0,
    replay: [],
    totalComments: [],
  };

  const p = await PostModel.create(post);
  await UserModel.findByIdAndUpdate(user._id, { $push: { posts: p } });

  res.status(201).json({
    message: "post created SuccessFully",
    data: p,
  });
};

const postLike = async (req, res) => {
  const foundUser = req.user;
  const foundPost = req.post;

  const postOwner = foundPost.user.userId;
  const postOwnerObjectId = new mongoose.Types.ObjectId(postOwner);

  // check

  const alreadyLiked = foundPost.totalLikes.find((likes) => {
    return likes._id.toString() === foundUser._id.toString();
  });

  if (alreadyLiked) {
    const data = await UserModel.findOneAndUpdate(
      {
        _id: postOwnerObjectId,
        "posts._id": foundPost._id,
      },
      {
        $inc: { "posts.$.likes": -1 },
        $pull: {
          "posts.$.totalLikes": {
            _id: foundUser._id,
          },
        },
      },
    );

    await PostModel.findByIdAndUpdate(foundPost._id, {
      $inc: { likes: -1 },
      $pull: {
        totalLikes: {
          _id: foundUser._id,
        },
      },
    });

    return res.status(200).json({
      message: "Post UnLiked...",
      data: {
        user: foundUser.username,
        postOwner: data.username,
      },
    });
  }

  const user = {
    username: foundUser.username,
    _id: foundUser._id,
    profilePic: foundUser.profilePic,
  };

  // update

  const data = await UserModel.findOneAndUpdate(
    {
      _id: postOwnerObjectId,
      "posts._id": foundPost._id,
    },
    {
      $inc: { "posts.$.likes": 1 },
      $push: {
        "posts.$.totalLikes": user,
        notification: `${user.username} liked you post`,
      },
    },
  );

  await PostModel.findByIdAndUpdate(foundPost._id, {
    $inc: { likes: 1 },
    $push: { totalLikes: user },
  });

  res.status(200).json({
    message: "Post Like SuccessFully",
    data: {
      user: foundUser.username,
      postOwner: data.username,
    },
  });
};

const postComment = async (req, res) => {
  const post = req.post;
  const user = req.user;
  const { text } = req.body;

  if (!text) {
    res.status(400).json({
      message: "Comment is Required",
      success: false,
    });
    return;
  }

  const postOwner = post.user.userId;
  const postOwnerObjectId = new mongoose.Types.ObjectId(postOwner);
  const postObjectId = new mongoose.Types.ObjectId(post._id);

  const userObj = {
    username: user.username,
    userId: user._id,
    profilePic: user.profilePic,
    comment: text,
    commentId: nanoid(),
    replays: [],
    createdAt: new Date(),
  };

  // update

  const data = await UserModel.findOneAndUpdate(
    {
      _id: postOwnerObjectId,
      "posts._id": postObjectId,
    },

    {
      $inc: {
        "posts.$.comment": 1,
      },
      $push: {
        "posts.$.totalComments": userObj,
      },
    },
  );

  await PostModel.findByIdAndUpdate(post._id, {
    $inc: { comment: 1 },
    $push: { totalComments: userObj },
  });

  res.status(201).json({
    message: "Comment Added SuccessFully",
    data: {
      user: user.username,
      postOwner: data.username,
    },
  });
};

const postReplay = async (req, res) => {
  const { commentId, text } = req.body;
  const foundUser = req.user;
  const foundPost = req.post;

  if (!commentId || !text) {
    return res.status(400).json({
      message: "Please fill in all required fields.",
    });
  }

  const postOwner = foundPost.user.userId;
  const foundOwnerUser = await UserModel.findById(postOwner);

  const foundPostOwner = foundOwnerUser.posts.find((p) => {
    return p._id.toString() === foundPost._id.toString();
  });

  if (!foundPostOwner) {
    return res.status(404).json({
      message: "post not found",
    });
  }

  const commentFound = foundPostOwner.totalComments.find((c) => {
    return c.commentId === commentId;
  });

  if (!commentFound) {
    return res.status(400).json({
      message: "invalid info",
    });
  }

  // update

  const commentNanoId = nanoid();

  const user = {
    username: foundUser.username,
    userId: foundUser._id,
    profilePic: foundUser.profilePic,
    comment: text,
    commentId: commentNanoId,
    replays: [],
    replay: true,
    parentId: commentFound.commentId,
    commentOwnerReplay: commentFound.username,
    createdAt: new Date(),
  };

  const replay = {
    userId: foundUser._id,
    text,
    replayId: user.commentId,
    commentId: commentFound.commentId,
    username: foundUser.username,
    profilePic: foundUser.profilePic,
  };

  // post and user update

  await UserModel.findOneAndUpdate(
    {
      _id: postOwner,
    },
    {
      $inc: {
        "posts.$[post].comment": 1,
      },

      $push: {
        "posts.$[post].totalComments.$[comment].replays": replay,
      },
    },
    {
      arrayFilters: [
        { "post._id": foundPost._id },
        { "comment.commentId": commentId },
      ],
      returnDocument: "after",
    },
  );

  await UserModel.findByIdAndUpdate(
    {
      _id: postOwner,
    },
    {
      $push: {
        "posts.$[post].totalComments": user,
      },
    },
    {
      arrayFilters: [
        {
          "post._id": foundPost._id,
        },
      ],
      returnDocument: "after",
    },
  );

  await PostModel.findOneAndUpdate(
    {
      _id: foundPost._id,
    },
    {
      $inc: { comment: 1 },
      $push: { totalComments: user },
    },
  );

  await PostModel.findOneAndUpdate(
    {
      _id: foundPost._id,
    },

    {
      $push: {
        "totalComments.$[comment].replays": replay,
      },
    },

    {
      arrayFilters: [
        {
          "comment.commentId": commentId,
        },
      ],
    },
  );

  res.status(201).json({
    message: "replay successfully added",
  });
};

const postDelete = async (req, res) => {
  const user = req.user;
  const post = req.post;

  const foundPost = user.posts.find((p) => {
    return p._id.toString() === post._id.toString();
  });

  if (!foundPost) {
    res.status(400).json({
      message: "You are not authorized to delete this post.",
    });
    return;
  }

  await PostModel.findByIdAndDelete(post._id);
  await UserModel.findOneAndUpdate(
    {
      _id: user._id,
    },
    {
      $pull: {
        posts: { _id: post._id },
      },
    },
  );

  res.status(200).json({
    message: "Post deleted SuccessFully",
  });
};

const postEdit = async (req, res) => {
  console.log(req.body);
  const { existingImages, description } = req.body;
  const updateInfo = {};
  const userObjectInfo = {};
  const user = req.user;
  const post = req.post;

  if (post.user.userId.toString() !== user._id.toString()) {
    return res.status(400).json({
      message: "You are not authorized to update this post.",
    });
  }
  if (description) {
    updateInfo.description = description;
    userObjectInfo["posts.$[post].description"] = description;
  }

  console.log(existingImages);

  if (!existingImages) {
    res.status(400).json({
      message: "No information provided",
    });
    return;
  }

  // existing images

  const newImagesUrls = [];
  let updateImages = null;

  const files = req.files;

  if (files) {
    for (let i = 0; i < files.length; i++) {
      const uploadImage = await imagekit.upload({
        file: files[i].buffer,
        fileName: files[i].originalname,
        folder: "posts",
      });

      newImagesUrls.push({
        url: uploadImage.url,
        id: nanoid(),
      });
    }
    updateImages = JSON.parse(existingImages).concat(newImagesUrls);
  }

  updateInfo.images = updateImages ? updateImages : existingImages;
  userObjectInfo["posts.$[post].images"] = updateImages
    ? updateImages
    : existingImages;
  // update

  await PostModel.findByIdAndUpdate(
    {
      _id: post._id,
    },
    {
      ...updateInfo,
    },
  );
  await UserModel.findOneAndUpdate(
    {
      _id: user._id,
    },

    {
      $set: {
        ...userObjectInfo,
      },
    },

    {
      arrayFilters: [
        {
          "post._id": post._id,
        },
      ],
    },
  );

  res.status(200).json({
    message: "update post SuccessFully",
  });
};

const postCommentEdit = async (req, res) => {
  const { text, commentId } = req.body;
  if (!text || !commentId) {
    res.status(400).json({
      message: "no information provided",
    });
    return;
  }

  const post = req.post;
  const user = req.user;
  const postOwnerObjectId = new mongoose.Types.ObjectId(post.user.userId);

  const commentFound = post.totalComments.find((c) => {
    return (
      c.commentId === commentId && c.userId.toString() === user._id.toString()
    );
  });

  if (!commentFound) {
    res.status(404).json({
      message: "comment not found",
    });
    return;
  }

  await PostModel.findOneAndUpdate(
    { _id: post._id },
    {
      "totalComments.$[comment].comment": text,
    },
    {
      arrayFilters: [
        {
          "comment.commentId": commentId,
        },
      ],
    },
  );

  await UserModel.findOneAndUpdate(
    {
      _id: postOwnerObjectId,
    },
    {
      "posts.$[post].totalComments.$[comment].comment": text,
    },
    {
      arrayFilters: [
        {
          "post._id": post._id,
        },
        {
          "comment.commentId": commentId,
        },
      ],
    },
  );

  res.status(200).json({
    message: "comment updated SuccessFully",
  });
};

const postReplayUpdate = async (req, res) => {
  const { text, commentId, replayId } = req.body;
  if (!text || !replayId || !commentId) {
    res.status(400).json({
      message: "No information provided",
    });
    return;
  }

  const user = req.user;
  const post = req.post;

  const userObjectId = new mongoose.Types.ObjectId(post.user.userId);

  const commentFound = post.totalComments.find((c) => {
    return (
      c.commentId === commentId && c.userId.toString() === user._id.toString()
    );
  });

  const sameCommentFound = post.totalComments.find((c) => {
    return c.commentId === replayId;
  });

  // if(!commentFound){
  //  return res.status(404).json({
  //     message : 'comment not found'
  //   })
  // }

  if (!commentFound && sameCommentFound) {
    await PostModel.findOneAndUpdate(
      {
        _id: post._id,
      },
      {
        "totalComments.$[comment].comment": text,
      },
      {
        arrayFilters: [
          {
            "comment.commentId": replayId,
          },
        ],
      },
    );

    await UserModel.findOneAndUpdate(
      {
        _id: userObjectId,
      },
      {
        "posts.$[post].totalComments.$[comment].comment": text,
      },
      {
        arrayFilters: [
          {
            "post._id": post._id,
          },
          {
            "comment.commentId": replayId,
          },
        ],

        returnDocument: "after",
      },
    );

    return res.status(200).json({
      message: "replay edit SuccessFully",
    });
  }

  let replayCheck = null;
  let commentOwner = null;

  for (let i = 0; i < post.totalComments.length; i++) {
    const comment = post.totalComments[i];
    for (let j = 0; j < comment.replays.length; j++) {
      const replay = comment.replays[j];
      if (replay.replayId === replayId) {
        replayCheck = replay;
        commentOwner = replay.commentId;
        break;
      }
    }
  }

  if (!replayCheck) {
    res.status(404).json({
      message: "replay not found",
    });
    return;
  }

  // update

  // post update
  await PostModel.findOneAndUpdate(
    {
      _id: post._id,
    },
    {
      "totalComments.$[comment].replays.$[replay].text": text,
    },
    {
      arrayFilters: [
        {
          "comment.commentId": commentOwner,
        },

        {
          "replay.replayId": replayId,
        },
      ],
    },
  );

  await PostModel.findOneAndUpdate(
    {
      _id: post._id,
    },
    {
      "totalComments.$[comment].comment": text,
    },
    {
      arrayFilters: [
        {
          "comment.commentId": replayId,
        },
      ],
    },
  );

  // user update

  const update1 = await UserModel.findOneAndUpdate(
    {
      _id: userObjectId,
    },
    {
      "posts.$[post].totalComments.$[comment].replays.$[replay].text": text,
    },

    {
      arrayFilters: [
        { "post._id": post._id },
        { "comment.commentId": commentId },
        { "replay.replayId": replayId },
      ],
      returnDocument: "after",
    },
  );

  const update2 = await UserModel.findOneAndUpdate(
    {
      _id: userObjectId,
    },
    {
      "posts.$[post].totalComments.$[comment].comment": text,
    },
    {
      arrayFilters: [
        {
          "post._id": post._id,
        },
        {
          "comment.commentId": replayId,
        },
      ],

      returnDocument: "after",
    },
  );

  console.log(update1, ".........", update2);

  res.status(200).json({
    message: "replay update SuccessFully",
  });
};

const commentDelete = async (req, res) => {
  const { commentId } = req.body;

  const post = req.post;
  const user = req.user;

  const postOwnerObjectId = new mongoose.Types.ObjectId(post.user.userId);

  if (!commentId) {
    return res.status(400).json({
      message: "CommentId is Required",
    });
  }

  const commentFound = post.totalComments.find((comment) => {
    return comment.commentId === commentId;
  });

  if (!commentFound) {
    return res.status(404).json({
      message: "comment not found",
    });
  }

  console.log(commentFound.userId, user._id);

  if (commentFound.userId.toString() !== user._id.toString()) {
    return res.status(400).json({
      message: "You are not authorized to delete this comment",
    });
  }

  // update

  await PostModel.findOneAndUpdate(
    {
      _id: post._id,
    },
    {
      $pull: {
        totalComments: {
          commentId: commentFound.commentId,
        },
      },
      $inc: {
        comment: -1,
      },
    },
  );

  await UserModel.findOneAndUpdate(
    {
      _id: postOwnerObjectId,
      "posts._id": post._id,
    },
    {
      $pull: {
        "posts.$.totalComments": {
          commentId: commentFound.commentId,
        },
      },
      $inc: {
        "posts.$.comment": -1,
      },
    },
  );

  return res.status(200).json({
    message: "comment deleted SuccessFully",
  });
};

const allPosts = async (req, res) => {
  const posts = await PostModel.find();

  return res.status(200).json({
    message: "posts fetched successFully",
    data: {
      posts: posts,
    },
  });
};

const replayDelete = async (req, res) => {
  const { commentId, replayId } = req.body;

  if (!commentId || !replayId) {
    return res.status(400).json({
      message: "comment and Replay Id is Required",
    });
  }

  const user = req.user;
  const post = req.post;

  const postOwnerObjectId = new mongoose.Types.ObjectId(post.user.userId);

  const foundComment = await post.totalComments.find((comment) => {
    return comment.commentId === commentId;
  });

  const sameCommentCheck = await post.totalComments.find((comment) => {
    return comment.commentId === replayId;
  });

  if (!foundComment && sameCommentCheck) {
    await PostModel.findByIdAndUpdate(post._id, {
      $pull: {
        totalComments: {
          commentId: sameCommentCheck.commentId,
        },
      },

      $inc: {
        comment: -1,
      },
    });

    await UserModel.findOneAndUpdate(
      {
        _id: postOwnerObjectId,
        "posts._id": post._id,
      },
      {
        $pull: {
          "posts.$.totalComments": {
            commentId: sameCommentCheck.commentId,
          },
        },

        $inc: {
          "posts.$.comment": -1,
        },
      },
    );

    return res.status(200).json({
      message: "replay Delete SuccessFully",
    });
  }

  const foundReplay = await foundComment.replays.find((replay) => {
    return replay.replayId === replayId;
  });

  if (!foundReplay) {
    return res.status(404).json({
      message: "replay not found",
    });
  }

  if (!sameCommentCheck) {
    return res.status(400).json({
      message: "invalid Information",
    });
  }

  if (sameCommentCheck.userId.toString() !== user._id.toString()) {
    return res.status(400).json({
      message: "You are not authorized to delete this comment",
    });
  }

  // update

  await PostModel.findOneAndUpdate(
    {
      _id: post._id,
      "totalComments.commentId": commentId,
    },
    {
      $pull: {
        "totalComments.$.replays": foundReplay,
      },
    },
  );

  await PostModel.findOneAndUpdate(
    {
      _id: post._id,
    },
    {
      $pull: {
        totalComments: { commentId: sameCommentCheck.commentId },
      },
      $inc: {
        comment: -1,
      },
    },
  );

  // user update

  const update1 = await UserModel.findOneAndUpdate(
    {
      _id: postOwnerObjectId,
      "posts._id": post._id,
    },
    {
      $pull: {
        "posts.$.totalComments.$[comment].replays": foundReplay,
      },
    },

    {
      arrayFilters: [
        {
          "comment.commentId": commentId,
        },
      ],
    },
  );

  const update2 = await UserModel.findOneAndUpdate(
    {
      _id: postOwnerObjectId,
      "posts._id": post._id,
    },

    {
      $pull: {
        "posts.$.totalComments": {
          commentId: sameCommentCheck.commentId,
        },
      },
      $inc: {
        "posts.$.comment": -1,
      },
    },
  );

  res.status(200).json({
    message: "replay deleted SuccessFully",
  });
};

module.exports = {
  postCreate,
  postLike,
  postComment,
  postReplay,
  postDelete,
  postEdit,
  postCommentEdit,
  postReplayUpdate,
  allPosts,
  commentDelete,
  replayDelete,
};
