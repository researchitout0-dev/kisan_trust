import Field from "../models/field_model.js";

export const createField = async (req,res)=>{
    try{
        const {fieldName,areaSize,currentCrop,location} = req.body;
        const farmerID = req.farmerID
        const existedField = await Field.findOne({
            farmer: farmerID,
            'location.latitude': location.latitude,
            'location.longitude': location.longitude
        });
        if(existedField){
            return res.status(400).json({message: "Field already exists at this location"})
        }
        const newField = await Field.create({
            farmer:farmerID,
            fieldName,
            areaSize,
            currentCrop,
            location,
            isVerified:false
        })
        return res.status(201).json({message:"Field created Successfully",field:newField })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({message: "Internal Server Error"})
        
    }
};

export const getField = async (req,res)=>{
    try{
        const fields = await Field.find({farmer:req.farmerID});
    if(fields.length ===0){
        return res.status(404).json({message:"No Fields Found"})
    }
    return res.status(200).json({fields})
    }
    catch(error){
        console.log(error);
        return res.status(500).json({message: "Internal Server Error"})  
    }
}

export const updateField = async (req, res) => {
    try {
        const { fieldName, areaSize, currentCrop, location } = req.body;
        const field = await Field.findOne({ _id: req.params.id, farmer: req.farmerID });

        if (!field) {
            return res.status(404).json({ message: "Field not found" });
        }

        if (fieldName) field.fieldName = fieldName;
        if (areaSize) field.areaSize = areaSize;
        if (currentCrop) field.currentCrop = currentCrop;
        if (location) field.location = location;

        await field.save();
        return res.status(200).json({ message: "Field updated successfully", field });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const deleteField = async (req, res) => {
    try {
        const field = await Field.findOneAndDelete({ _id: req.params.id, farmer: req.farmerID });

        if (!field) {
            return res.status(404).json({ message: "Field not found" });
        }

        return res.status(200).json({ message: "Field deleted successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};