const app = require('./src/app')
const connectDB = require('./src/config/database')
const config = require('./src/config/dotenv')

const port = config.port || 3000

// connect DB 

connectDB()

app.listen(port , ()=>{
    console.log('server is Running SuccessFully')
})