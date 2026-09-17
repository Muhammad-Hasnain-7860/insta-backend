const Imagekit = require('imagekit')
const config = require('../config/dotenv')
const imagekit = new Imagekit({
    publicKey : config.publicKey,
    privateKey : config.privateKey,
    urlEndpoint : config.urlEndpoint
})

module.exports = imagekit