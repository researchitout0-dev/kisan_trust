import createCloudinaryStorage from "multer-storage-cloudinary";// this brings in the CloudinaryStorage factory from the package
import multer from "multer";// for file uplod
import cloudinary from "../config/cloudinary.js";// for img storage to get image string

const storage = createCloudinaryStorage({
    cloudinary: cloudinary,
    params:{
        folder:"kisantrust/diagnoses",
        allowed_formats:["jpg","jpeg","png"],
    },
});

const upload = multer({storage});

export default upload;