import mongoose from "mongoose";
import dotenv from "dotenv";
import { DB_NAME } from "../constants.js";
import logger from "../utils/logger.js";

dotenv.config()

const connectDB = async () => {
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        logger.info("You are connected to the database !")
    }catch{
        console.log("DB connection error !!")
    }
}

export default connectDB