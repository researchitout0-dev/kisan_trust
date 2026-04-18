import "dotenv/config";
import  express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authroutes from "./routes/authroutes.js";
import fieldroutes from "./routes/fieldroutes.js"
import uploadImage from "./routes/uploadImage.js"
import diagnosisroutes from "./routes/diagnosisroutes.js"
import scoreroutes from "./routes/scoreroutes.js"
import lenderroutes from "./routes/lenderroutes.js"

connectDB()
const app = express()

app.use(cors());
app.use(express.json())
const PORT = process.env.PORT 

//routes
app.use("/api/auth", authroutes)
app.use("/api/fields",fieldroutes)
app.use("/api/upload",uploadImage)
app.use("/api/diagnosis", diagnosisroutes)
app.use("/api/score", scoreroutes)
app.use("/api/lenders", lenderroutes)

app.get("/",(req,res)=>{
    res.json({message: "KisanTrust Backend Is running"})
})



app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}/`);
    
})