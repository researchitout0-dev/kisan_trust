import mongoose from "mongoose";

const loanApplicationSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Farmer",
        required: true,
    },
    lender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lender",
        required: true,
    },
    amountRequested: {
        type: Number,
        required: true,
    },
    purpose: {
        type: String,
        enum: ["seeds", "fertilizer", "equipment", "irrigation", "other"],
        required: true,
    },
    agriScoreAtTime: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    lenderNote: {
        type: String,
        default: "",
    },
}, { timestamps: true });

export default mongoose.model("LoanApplication", loanApplicationSchema);
