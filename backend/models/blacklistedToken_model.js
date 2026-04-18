import mongoose from "mongoose";

/**
 * Stores blacklisted (logged out) JWT tokens.
 * Tokens auto-expire after 7 days (matching JWT expiry).
 */
const blacklistedTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800, // auto-delete after 7 days (7 * 24 * 60 * 60)
    },
});

export default mongoose.model("BlacklistedToken", blacklistedTokenSchema);
