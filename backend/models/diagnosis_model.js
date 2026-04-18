import mongoose from "mongoose";

const diagnosis_Schema = new mongoose.Schema({
    farmer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Farmer',
        required:true
    },
    field:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Field',
        required:true,

    },
    imageUrl:{
        type:String,
        required:true,
    },
    cropType:{
        type:String,
        required:true
    },
    location:{
        latitude:{type:Number,required:true},
        longitude:{type:Number,required:true},
        accuracy:{type:Number,required:true}
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    distanceFromField:{
        type:Number,
    },
    soilCondition:{
        type:String
    },
    diseaseDetected:{
        type:String
    },
    severity:{
        type:String

    },
    confidence:{
        type:Number
    },
    treatmentPlan:{
        type:String,
    },
    treatmentPlanTranslated:{
        type:String,
    },
    translationLanguage:{
        type:String,
    },
    recommendedAction:{
        type:[String],
        default:[],
    },
    followupDate:{
        type:Date,

    },
    isFollowup:{
        type:Boolean,
        default:false
    },
    previousDiagnosis:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Diagnosis',

    },
    growthScore:{
        type:Number
    },
    weather:{
        temperature:{type:Number},      // °C
        humidity:{type:Number},          // %
        rainfall:{type:Number},          // mm
        windSpeed:{type:Number},         // m/s
        condition:{type:String},         // "Rain", "Clear", etc.
        description:{type:String},       // "light rain", "clear sky"
    }
},{timestamps:true})

export default mongoose.model('Diagnosis',diagnosis_Schema);