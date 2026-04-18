import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
    fieldName:{
        type:String,
        required: true,
        trim:true
    },
    farmer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Farmer',
        required:true
    },
    location:{
        latitude:{type:Number,required:true},
        longitude:{type:Number,required:true},
        village:{type:String},
        state:{type:String},
    },
    areaSize:{
        type:Number,
        required:true,

    },
    currentCrop:{
        type:String
    },
    isVerified:{
        type:Boolean,
        default:false
    }   


},{timestamps:true})

export default mongoose.model('Field',fieldSchema)