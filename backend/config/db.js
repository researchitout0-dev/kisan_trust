import mongoose from "mongoose";
import dotenv from "dotenv";

const connectDB = async ()=>{
    try{
        const contact = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`MongoDB Connected`);
    }catch(error){
        console.error(`MongoDB Connection Failed: `,error.message);
        process.exit(1)
        
    }
}
export default connectDB
