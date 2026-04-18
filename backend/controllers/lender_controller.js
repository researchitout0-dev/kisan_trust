import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Lender from "../models/lender_model.js";
import Farmer from "../models/farmer_model.js";
import Diagnosis from "../models/diagnosis_model.js";
import LoanApplication from "../models/loanApplication_model.js";
import { sendLoanNotification } from "../utils/smsService.js";

/**
 * POST /api/lenders/register
 */
export const registerLender = async (req, res) => {
    try {
        const { organizationName, contactPerson, email, password, licenseNumber } = req.body;

        const existingLender = await Lender.findOne({ email });
        if (existingLender) {
            return res.status(400).json({ message: "Lender already registered with this email" });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const newLender = await Lender.create({
            organizationName,
            contactPerson,
            email,
            password: hashPassword,
            licenseNumber,
        });

        return res.status(201).json({
            message: "Lender registered successfully",
            lender: { id: newLender._id, organizationName: newLender.organizationName },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * POST /api/lenders/login
 */
export const loginLender = async (req, res) => {
    try {
        const { email, password } = req.body;

        const lender = await Lender.findOne({ email });
        if (!lender) {
            return res.status(400).json({ message: "Lender not found" });
        }

        const isMatch = await bcrypt.compare(password, lender.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Include role: "lender" so the lenderAuth middleware can verify
        const token = jwt.sign(
            { id: lender._id, role: "lender" },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            token,
            lender: {
                id: lender._id,
                organizationName: lender.organizationName,
                contactPerson: lender.contactPerson,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * GET /api/lenders/farmers/:phone
 * Lender looks up a farmer by phone number to see their score and history.
 */
export const viewFarmerProfile = async (req, res) => {
    try {
        const { phone } = req.params;

        const farmer = await Farmer.findOne({ phone }).select("-password");
        if (!farmer) {
            return res.status(404).json({ message: "Farmer not found" });
        }

        // Get farmer's diagnosis history
        const diagnoses = await Diagnosis.find({ farmer: farmer._id })
            .sort({ createdAt: -1 })
            .select("cropType diseaseDetected severity confidence growthScore isFollowup createdAt imageUrl")
            .limit(20);

        // Get diagnosis summary stats
        const totalDiagnoses = await Diagnosis.countDocuments({ farmer: farmer._id });
        const followUps = await Diagnosis.countDocuments({ farmer: farmer._id, isFollowup: true });
        const verifiedUploads = await Diagnosis.countDocuments({ farmer: farmer._id, isVerified: true });

        return res.status(200).json({
            farmer: {
                name: farmer.name,
                phone: farmer.phone,
                village: farmer.village,
                state: farmer.state,
                landsize: farmer.landsize,
                cropTypes: farmer.cropTypes,
                agriTrustScore: farmer.agriTrustScore,
                maxScore: 850,
                memberSince: farmer.createdAt,
            },
            stats: {
                totalDiagnoses,
                followUps,
                verifiedUploads,
                verificationRate: totalDiagnoses > 0 ? Math.round((verifiedUploads / totalDiagnoses) * 100) : 0,
            },
            recentDiagnoses: diagnoses,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * POST /api/loan-applications
 * Lender creates/processes a loan application for a farmer.
 * Body: { farmerPhone, amountRequested, purpose, status, lenderNote }
 */
export const processLoanApplication = async (req, res) => {
    try {
        const { farmerPhone, amountRequested, purpose, status, lenderNote } = req.body;
        const lenderID = req.lenderID;

        // Find the farmer
        const farmer = await Farmer.findOne({ phone: farmerPhone });
        if (!farmer) {
            return res.status(404).json({ message: "Farmer not found" });
        }

        const application = await LoanApplication.create({
            farmer: farmer._id,
            lender: lenderID,
            amountRequested,
            purpose,
            agriScoreAtTime: farmer.agriTrustScore,
            status: status || "pending",
            lenderNote: lenderNote || "",
        });

        // --- Notify farmer via SMS ---
        if (application.status === "approved" || application.status === "rejected") {
            sendLoanNotification(farmer.phone, farmer.name, application.status, amountRequested)
                .catch(err => console.error("Loan SMS error:", err.message));
        }

        return res.status(201).json({
            message: `Loan application ${application.status}`,
            application: {
                id: application._id,
                farmerName: farmer.name,
                farmerPhone: farmer.phone,
                amountRequested: application.amountRequested,
                purpose: application.purpose,
                agriScoreAtTime: application.agriScoreAtTime,
                status: application.status,
                lenderNote: application.lenderNote,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * GET /api/loan-applications
 * Lender sees all loan applications they've processed.
 */
export const getLoanApplications = async (req, res) => {
    try {
        const applications = await LoanApplication.find({ lender: req.lenderID })
            .populate("farmer", "name phone village agriTrustScore")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: applications.length,
            applications,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
