import express from "express";
import verifyToken from "../middleware/authmiddleware.js";
import Farmer from "../models/farmer_model.js";
import { calculateScore, collectFeatures } from "../utils/scoreService.js";

const router = express.Router();

/**
 * GET /api/score
 * Get the farmer's current Agri-Trust Score.
 * Triggers a fresh recalculation (formula or ML model).
 */
router.get("/", verifyToken, async (req, res) => {
    try {
        const result = await calculateScore(req.farmerID);
        const farmer = await Farmer.findById(req.farmerID).select("name phone agriTrustScore");

        return res.status(200).json({
            agriTrustScore: farmer.agriTrustScore,
            maxScore: 850,
            farmerName: farmer.name,
            method: result.method, // "formula" or "ml-model"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/**
 * GET /api/score/breakdown
 * Detailed breakdown with raw features.
 * When using ML model, features are still shown so you know what the model received.
 */
router.get("/breakdown", verifyToken, async (req, res) => {
    try {
        const farmerID = req.farmerID;
        const result = await calculateScore(farmerID);
        const farmer = await Farmer.findById(farmerID).select("name phone agriTrustScore");
        const features = await collectFeatures(farmerID);

        if (!features) {
            return res.status(200).json({
                agriTrustScore: 0,
                maxScore: 850,
                method: "no-data",
                message: "No diagnoses yet. Upload your first crop photo to start building your score!",
            });
        }

        return res.status(200).json({
            agriTrustScore: farmer.agriTrustScore,
            maxScore: 850,
            method: result.method,
            farmerName: farmer.name,
            // Raw features — what the ML model / formula uses
            features,
            // Human-readable breakdown (from formula logic)
            breakdown: {
                diagnosisFrequency: {
                    weight: "30%",
                    detail: `${features.uploadsLastMonth} uploads in last 30 days (total: ${features.totalDiagnoses})`,
                },
                cropImprovement: {
                    weight: "25%",
                    detail: features.followUpCount > 0
                        ? `${features.followUpCount} follow-ups, avg growth: ${features.avgGrowthScore}%`
                        : "No follow-ups yet",
                },
                locationConsistency: {
                    weight: "20%",
                    detail: `${features.verifiedCount}/${features.totalDiagnoses} verified (${Math.round(features.locationVerifiedRatio * 100)}%)`,
                },
                seasonalManagement: {
                    weight: "15%",
                    detail: `${features.uniqueCropCount} crop(s): ${features.cropTypes.join(", ")}`,
                },
                responseTime: {
                    weight: "10%",
                    detail: features.severeCount > 0
                        ? `${features.quickResponseCount}/${features.severeCount} severe cases responded quickly`
                        : "No severe diagnoses yet",
                },
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

/**
 * GET /api/score/features
 * Returns raw features JSON — useful for your friend to train the ML model.
 * They can call this endpoint to collect training data.
 */
router.get("/features", verifyToken, async (req, res) => {
    try {
        const features = await collectFeatures(req.farmerID);

        if (!features) {
            return res.status(200).json({ message: "No data yet", features: null });
        }

        return res.status(200).json({ features });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;
