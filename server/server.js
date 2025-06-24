import app from "./app.js";
import logger from "./utils/logger.js";

app.get("/",(req,res)=>{
  res.send("Welcome to Restaurant web app")
})

app.listen(8001,()=>{
  logger.info("App is listening on port 8001")
})