import jwt from "jsonwebtoken";
import BlacklistedToken from "../models/blacklistedToken_model.js";

const verifyToken = async (req,res,next)=>{
    const authHeaders = req.headers.authorization;

    if(!authHeaders || !authHeaders.startsWith("Bearer")){
        return res.status(401).json({message:"No Token Provided"})
    }

    const token = authHeaders.split(" ")[1];

    try{
        // Check if token is blacklisted (logged out)
        const isBlacklisted = await BlacklistedToken.findOne({ token });
        if (isBlacklisted) {
            return res.status(401).json({ message: "Token has been invalidated. Please login again." });
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.farmerID = decoded.id
        next()
    }
    catch(error){
        return res.status(401).json({message: "Invaild or expired token"});
    }
};

export default verifyToken;
