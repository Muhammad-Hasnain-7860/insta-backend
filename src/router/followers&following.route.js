const express = require("express");
const {
  follow,
  unFollow,
} = require("../controller/followAndFollowing.controller");
const  authMiddleWare  = require("../middleware/auth.middleware");

const followersAndFollowingRoute = express.Router();

followersAndFollowingRoute.post("/:id", authMiddleWare, follow);
followersAndFollowingRoute.delete("/:id", authMiddleWare, unFollow);

module.exports = followersAndFollowingRoute;
