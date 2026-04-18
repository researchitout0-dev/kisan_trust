import mongoose from "mongoose";

const farmerSchema = new mongoose.Schema({
    name :{
        type:String,
        required: true,
        trim: true
    },
    phone: {
        type:String,
        unique: true,
        required: true,
        trim:true
    },
    village :{
        type:String,
        trim:true,
    
    },
    state: {
        type: String,
        trim: true
    },
    password:{
        type: String,
        required: true
    },
    landsize:{
        type:Number,
        required:true
    },
    cropTypes:{
        type:[String]
    },
    agriTrustScore:{
        type:Number,
        default:0
    },
    language:{
        type:String,
        default:"english" // hindi, marathi, tamil, telugu, etc.
    }
},{timestamps:true})

export default mongoose.model('Farmer',farmerSchema)