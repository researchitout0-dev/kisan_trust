
export const uploadImage = async (req,res)=>{
    try{
        const existedImage = req.file
        if(!existedImage){
            return res.status(400).json({message: "Image not Found"})
        }
        return res.status(201).json({message:"Image Uploaded Successfully", imageUrl: req.file.path})
    }
    catch(error){
        console.log(error);
        return res.status(500).json({message:"Internal Server Error"})
        
    }

    
}
