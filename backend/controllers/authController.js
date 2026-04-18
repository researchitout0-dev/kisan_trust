import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Farmer from "../models/farmer_model.js";
import BlacklistedToken from "../models/blacklistedToken_model.js";

export const register = async (req,res)=>{
    try{
        const {name ,password , phone ,landsize , cropTypes,state,village} = req.body
        const existedUser = await Farmer.findOne({phone});
        if(existedUser){
            return res.status(400).json({message: "User already existed"})
        }
        const hashPassword = await bcrypt.hash(password,10);
        const newUser = await Farmer.create({
            name,
            phone,
            landsize,
            state,
            village,
            cropTypes,
            password:hashPassword,

        })
        // await newUser.save()  //Farmer.create alreay saved so its not needed
        res.status(201).json({message: "User Created Successfully"})


    }
    catch(error){
        console.log(error);
        res.status(500).json({message: "Internal Server Error"})
        
    }
}


export const login = async (req,res)=>{
    try{
        const {phone,password} = req.body
        const founduser = await Farmer.findOne({phone})

        if(!founduser){
            return res.status(400).json({message:"User Does not exists"})
        }

        const isMatch = await bcrypt.compare(password,founduser.password)
        if(!isMatch){
            return res.status(400).json({message: "Invalid Credentials"})

        }

        const token = jwt.sign({id:founduser._id},process.env.JWT_SECRET,{expiresIn: "7d"});

        res.status(200).json({token,user:{id:founduser._id,name:founduser.name,phone:founduser.phone}})

    }
    catch(error){
        res.status(500).json({message:"Internal Server Error"})
    }


}

export const logout = async (req, res) => {
    try {
        const authHeaders = req.headers.authorization;
        if (!authHeaders || !authHeaders.startsWith("Bearer")) {
            return res.status(400).json({ message: "No token provided" });
        }

        const token = authHeaders.split(" ")[1];

        // Add token to blacklist
        await BlacklistedToken.create({ token });

        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        // If token already blacklisted, still return success
        if (error.code === 11000) {
            return res.status(200).json({ message: "Already logged out" });
        }
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getProfile = async (req, res) => {
    try {
        const farmer = await Farmer.findById(req.farmerID).select("-password -__v");
        if (!farmer) {
            return res.status(404).json({ message: "Farmer not found" });
        }
        res.status(200).json({ farmer });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, village, state, landsize, cropTypes, language } = req.body;
        
        // Find existing farmer
        const farmer = await Farmer.findById(req.farmerID);
        if (!farmer) {
            return res.status(404).json({ message: "Farmer not found" });
        }

        // Update fields if provided
        if (name) farmer.name = name;
        if (village) farmer.village = village;
        if (state) farmer.state = state;
        if (landsize) farmer.landsize = landsize;
        if (cropTypes) farmer.cropTypes = cropTypes;
        if (language) farmer.language = language;

        await farmer.save();

        res.status(200).json({
            message: "Profile updated successfully",
            farmer: {
                id: farmer._id,
                name: farmer.name,
                phone: farmer.phone,
                language: farmer.language,
                agriTrustScore: farmer.agriTrustScore,
            }
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};