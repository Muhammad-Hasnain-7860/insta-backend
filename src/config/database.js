const { default: mongoose } = require("mongoose")
const config = require("./dotenv")

const connectDB = async()=>{
    try {
        await mongoose.connect(config.mongodb_uri)
        console.log('connect Db')
    } catch (error) {
        console.log('mongoDB connect Error' , error.message)
    }
}

module.exports = connectDB