import mongoose from "mongoose";

const lenderSchema = new mongoose.Schema({
    organizationName: {
        type: String,
        required: true,
        trim: true,
    },
    contactPerson: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    licenseNumber: {
        type: String,
        required: true,
        trim: true,
    },
}, { timestamps: true });

export default mongoose.model("Lender", lenderSchema);
