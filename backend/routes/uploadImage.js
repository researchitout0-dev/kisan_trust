import express from "express";
import verifyToken from "../middleware/authmiddleware.js";
import upload from "../middleware/upload.js";
import  {uploadImage}  from "../controllers/image_controller.js";

const router = express.Router()

router.post("/",verifyToken,upload.single("image"),uploadImage)

export default router;