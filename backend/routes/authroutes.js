import express from "express";
import { login, register, logout, getProfile, updateProfile } from "../controllers/authController.js";
import verifyToken from "../middleware/authmiddleware.js";

const router = express.Router()

router.post("/signup", register);
router.post("/login", login);
router.post("/logout", verifyToken, logout);

// Profile management
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

// Keep /me for backward compatibility optionally
router.get("/me", verifyToken, getProfile);

export default router;