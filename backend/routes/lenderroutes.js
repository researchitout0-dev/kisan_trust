import express from "express";
import verifyLenderToken from "../middleware/lenderAuth.js";
import {
    registerLender,
    loginLender,
    viewFarmerProfile,
    processLoanApplication,
    getLoanApplications,
} from "../controllers/lender_controller.js";

const router = express.Router();

// Public routes (no auth needed)
router.post("/register", registerLender);
router.post("/login", loginLender);

// Protected routes (lender JWT required)
router.get("/farmers/:phone", verifyLenderToken, viewFarmerProfile);

// Loan applications
router.post("/loan-applications", verifyLenderToken, processLoanApplication);
router.get("/loan-applications", verifyLenderToken, getLoanApplications);

export default router;
