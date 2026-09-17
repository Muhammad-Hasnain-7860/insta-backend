const config = require("../config/dotenv");
const UserModel = require("../model/user.model");
const jwt = require("jsonwebtoken");

const authMiddleWare = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "unauthorize user",
    });
  }

  try {
    const decodeToken = jwt.verify(token, config.JWT_ACCESS_SECRET);
    const user = await UserModel.findById(decodeToken.id);
    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "expire or invalid token",
    });
  }
};

module.exports = authMiddleWare;
