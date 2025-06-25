import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";

connectDB()
.then(()=>{
    app.get("/",(req,res)=>{
        res.send("Welcome to real estate marketplace")
    })
    
    app.listen(8001,()=>{
        logger.info("App is listening on port 8001")
    })
})
.catch((error)=>{
    logger.error("Mongo DB connection failed")
    logger.error(error)
})