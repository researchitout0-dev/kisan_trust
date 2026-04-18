/**
 * Agri-Trust Score Service
 * 
 * Collects farmer data features and calculates score.
 * 
 * TWO MODES:
 *   1. Built-in weighted formula (default) — works right now
 *   2. External ML model API — set ML_SCORE_API_URL in .env
 *      Your friend's model receives the raw features JSON and returns { score: 0-850 }
 * 
 * To switch to ML model:
 *   1. Your friend deploys their model as an API (Flask/FastAPI)
 *   2. Add ML_SCORE_API_URL=http://localhost:5000/predict to .env
 *   3. That's it — this service will call the ML model instead
 */

import Diagnosis from "../models/diagnosis_model.js";
import Farmer from "../models/farmer_model.js";

/**
 * Collect raw features from a farmer's data.
 * These features are passed to either the formula or the ML model.
 * 
 * Your friend can use these features to train the model:
 *   - totalDiagnoses, uploadsLastMonth
 *   - avgGrowthScore, followUpCount
 *   - locationVerifiedRatio
 *   - uniqueCropCount, cropTypes
 *   - avgResponseDays, severeCount, quickResponseCount
 *   - accountAgeDays
 */
export async function collectFeatures(farmerID) {
    const diagnoses = await Diagnosis.find({ farmer: farmerID }).sort({ createdAt: -1 });
    const farmer = await Farmer.findById(farmerID);

    if (!farmer || diagnoses.length === 0) {
        return null;
    }

    // --- Uploads in last 30 days ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDiagnoses = diagnoses.filter(d => d.createdAt >= thirtyDaysAgo);

    // --- Follow-ups and growth ---
    const followUps = diagnoses.filter(d => d.isFollowup && d.growthScore != null);
    const avgGrowthScore = followUps.length > 0
        ? followUps.reduce((sum, d) => sum + d.growthScore, 0) / followUps.length
        : 0;

    // --- Location verification ---
    const verifiedCount = diagnoses.filter(d => d.isVerified).length;
    const locationVerifiedRatio = diagnoses.length > 0 ? verifiedCount / diagnoses.length : 0;

    // --- Crop diversity ---
    const cropTypes = [...new Set(diagnoses.map(d => d.cropType?.toLowerCase()).filter(Boolean))];

    // --- Response time for severe diagnoses ---
    const severeDiagnoses = diagnoses.filter(d => d.severity === "high" && !d.isFollowup);
    let quickResponseCount = 0;
    let totalResponseDays = 0;
    let respondedCount = 0;

    for (const severe of severeDiagnoses) {
        const followUp = followUps.find(
            f => f.previousDiagnosis?.toString() === severe._id.toString()
        );
        if (followUp) {
            const daysDiff = (followUp.createdAt - severe.createdAt) / (1000 * 60 * 60 * 24);
            totalResponseDays += daysDiff;
            respondedCount++;
            if (daysDiff <= 3) quickResponseCount++;
        }
    }

    // --- Account age ---
    const accountAgeDays = Math.floor((Date.now() - farmer.createdAt) / (1000 * 60 * 60 * 24));

    return {
        farmerID: farmerID.toString(),
        totalDiagnoses: diagnoses.length,
        uploadsLastMonth: recentDiagnoses.length,
        followUpCount: followUps.length,
        avgGrowthScore: Math.round(avgGrowthScore * 100) / 100,
        locationVerifiedRatio: Math.round(locationVerifiedRatio * 100) / 100,
        verifiedCount,
        uniqueCropCount: cropTypes.length,
        cropTypes,
        severeCount: severeDiagnoses.length,
        quickResponseCount,
        respondedCount,
        avgResponseDays: respondedCount > 0 ? Math.round(totalResponseDays / respondedCount * 100) / 100 : null,
        accountAgeDays,
        landsize: farmer.landsize,
    };
}

/**
 * Calculate the Agri-Trust Score.
 * If ML_SCORE_API_URL is set → calls external ML model.
 * Otherwise → uses built-in weighted formula.
 */
export async function calculateScore(farmerID) {
    const features = await collectFeatures(farmerID);

    if (!features) {
        await Farmer.findByIdAndUpdate(farmerID, { agriTrustScore: 0 });
        return { score: 0, method: "no-data" };
    }

    const mlApiUrl = process.env.ML_SCORE_API_URL;

    if (mlApiUrl) {
        // ====== ML MODEL MODE ======
        try {
            console.log(`🤖 Calling ML model at ${mlApiUrl}`);
            const response = await fetch(mlApiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(features),
            });

            if (!response.ok) {
                throw new Error(`ML API returned ${response.status}`);
            }

            const result = await response.json();
            const score = Math.round(Math.min(850, Math.max(0, result.score)));

            await Farmer.findByIdAndUpdate(farmerID, { agriTrustScore: score });
            console.log(`📊 ML Score for farmer ${farmerID}: ${score}/850`);

            return { score, method: "ml-model", features };

        } catch (error) {
            console.error("⚠️ ML model failed, falling back to formula:", error.message);
            // Fall through to formula
        }
    }

    // ====== FORMULA MODE (fallback) ======
    const score = formulaScore(features);
    await Farmer.findByIdAndUpdate(farmerID, { agriTrustScore: score });
    console.log(`📊 Formula Score for farmer ${farmerID}: ${score}/850`);

    return { score, method: "formula", features };
}

/**
 * Built-in weighted formula.
 * Works as default until ML model is ready.
 */
function formulaScore(f) {
    // Factor 1: Diagnosis Frequency (30%)
    let freq = 5;
    if (f.uploadsLastMonth >= 4) freq = 30;
    else if (f.uploadsLastMonth >= 2) freq = 20;
    else if (f.uploadsLastMonth >= 1) freq = 10;

    // Factor 2: Crop Improvement (25%)
    let improvement = 5;
    if (f.followUpCount > 0) {
        if (f.avgGrowthScore >= 70) improvement = 25;
        else if (f.avgGrowthScore >= 40) improvement = 15;
        else improvement = 8;
    }

    // Factor 3: Location Consistency (20%)
    let location = 5;
    if (f.locationVerifiedRatio === 1) location = 20;
    else if (f.locationVerifiedRatio >= 0.8) location = 15;
    else if (f.locationVerifiedRatio >= 0.5) location = 10;

    // Factor 4: Seasonal Management (15%)
    let seasonal = 7;
    if (f.uniqueCropCount >= 3) seasonal = 15;
    else if (f.uniqueCropCount >= 2) seasonal = 10;

    // Factor 5: Response Time (10%)
    let response = 5;
    if (f.severeCount > 0 && f.respondedCount > 0) {
        const ratio = f.quickResponseCount / f.severeCount;
        if (ratio >= 0.8) response = 10;
        else if (ratio >= 0.5) response = 7;
        else response = 4;
    }

    const raw = freq + improvement + location + seasonal + response;
    return Math.round((raw / 100) * 850);
}
