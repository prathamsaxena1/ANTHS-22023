import app from "./app.js";

app.get("/",(req,res)=>{
  res.send("Welcome to Restaurant web app")
})

app.listen(8001,()=>{
  console.log("App is listening on port 8001")
})