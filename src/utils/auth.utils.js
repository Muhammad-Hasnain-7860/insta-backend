const jwt = require('jsonwebtoken') 
const config = require('../config/dotenv')

const generateTokens = (userId)=>{
    const accessToken = jwt.sign({
        id : userId
    },config.JWT_ACCESS_SECRET,{
        expiresIn :'15m'
    })

    const refreshToken = jwt.sign({
        id : userId
    },config.JWT_REFRESH_SECRET,{
        expiresIn : '7d'
    })


    return {
        refreshToken,
        accessToken 
    }
}

const verifyAccessToken = (token)=>{
    const decode = jwt.verify(token , config.JWT_ACCESS_SECRET)

    return decode
}

const verifyRefreshToke = (token)=>{
    const decode = jwt.verify(token , config.JWT_REFRESH_SECRET)

    return decode 
}

module.exports = {generateTokens , verifyAccessToken , verifyRefreshToke}