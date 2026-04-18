import express from "express";
import verifyToken from "../middleware/authmiddleware.js";
import { getField, createField, updateField, deleteField } from "../controllers/field_controllers.js";

const router = express.Router()

router.post("/", verifyToken, createField);

router.get("/", verifyToken, getField);

router.put("/:id", verifyToken, updateField);

router.delete("/:id", verifyToken, deleteField);

export default router