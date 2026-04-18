import express from "express";
import { createDiagnosis, getDiagnoses, getDiagnosisById, createFollowUp } from "../controllers/diagnosis_controller.js";
import verifyToken from "../middleware/authmiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router()

// POST /api/diagnosis — upload crop photo for diagnosis
router.post("/", verifyToken, upload.single("image"), createDiagnosis)

// GET /api/diagnosis — get all diagnoses for logged-in farmer
router.get("/", verifyToken, getDiagnoses)

// GET /api/diagnosis/:id — get single diagnosis details
router.get("/:id", verifyToken, getDiagnosisById)

// POST /api/diagnosis/:id/follow-up — upload follow-up photo for comparison
router.post("/:id/follow-up", verifyToken, upload.single("image"), createFollowUp)

export default router;