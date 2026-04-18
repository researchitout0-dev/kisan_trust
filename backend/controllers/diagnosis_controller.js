import Field from "../models/field_model.js";
import Diagnosis from "../models/diagnosis_model.js";
import Farmer from "../models/farmer_model.js";
import { calculateDistance } from "../utils/haversine.js";
import { analyzeImage } from "../utils/aiService.js";
import { getTreatment } from "../data/treatmentDatabase.js";
import { calculateScore } from "../utils/scoreService.js";
import { getWeather } from "../utils/weatherService.js";
import { translateText, translateObject } from "../utils/translationService.js";
import { sendFollowUpReminder } from "../utils/smsService.js";

const MAX_FIELD_DISTANCE = 100; // meters — reject if farmer is farther than this

/**
 * POST /api/diagnosis
 * Farmer uploads a crop photo for diagnosis.
 * 
 * Expects form-data with:
 *   - image (file)
 *   - fieldId (string)
 *   - cropType (string)
 *   - location (JSON string: { latitude, longitude, accuracy })
 */
export const createDiagnosis = async (req, res) => {
    try {
        const farmerID = req.farmerID;
        const { cropType, fieldId } = req.body;
        const location = JSON.parse(req.body.location);

        // --- Validate required fields ---
        if (!cropType || !fieldId || !location) {
            return res.status(400).json({ message: "Missing required fields: cropType, fieldId, location" });
        }
        if (!location.latitude || !location.longitude) {
            return res.status(400).json({ message: "Location must have latitude and longitude" });
        }

        // --- Check image was uploaded ---
        if (!req.file) {
            return res.status(400).json({ message: "Image is required" });
        }
        console.log("📷 Uploaded file object:", JSON.stringify(req.file, null, 2));
        const imageUrl = req.file.path || req.file.secure_url || req.file.url;
        if (!imageUrl) {
            return res.status(500).json({ message: "Image upload failed — no URL returned from Cloudinary" });
        }

        // --- Fetch the registered field ---
        const field = await Field.findOne({ _id: fieldId, farmer: farmerID });
        if (!field) {
            return res.status(404).json({ message: "Field not found or doesn't belong to you" });
        }

        // --- Fetch farmer for language preference ---
        const farmer = await Farmer.findById(farmerID);

        // --- GPS Verification: check distance from registered field ---
        const distance = calculateDistance(
            field.location.latitude,
            field.location.longitude,
            location.latitude,
            location.longitude
        );
        const distanceRounded = Math.round(distance);
        const locationVerified = distance <= MAX_FIELD_DISTANCE;

        if (!locationVerified) {
            return res.status(403).json({
                message: "Location verification failed",
                detail: `You are ${distanceRounded}m away from your registered field. Must be within ${MAX_FIELD_DISTANCE}m.`,
                distanceFromField: distanceRounded,
            });
        }

        // --- Send image and crop type to AI for disease detection ---
        const aiResult = await analyzeImage(imageUrl, req.body.cropType || field.currentCrop || "unknown");

        // --- Get treatment plan ---
        // If Plant.id returned expert treatment → use it directly
        // Otherwise → fall back to our local treatment database
        let treatment;
        if (aiResult.treatmentDetails) {
            // Plant.id provides expert-curated treatment (chemical, biological, prevention)
            const td = aiResult.treatmentDetails;
            treatment = {
                disease: aiResult.disease,
                severity: aiResult.severity,
                soilCondition: "assessed",
                treatmentPlan: aiResult.treatment,
                recommendedActions: [
                    td.prevention ? `Prevention: ${td.prevention}` : null,
                    td.biological ? `Biological: ${td.biological}` : null,
                    td.chemical ? `Chemical: ${td.chemical}` : null,
                    aiResult.description ? `About: ${aiResult.description}` : null,
                    "Consult your local Krishi Vigyan Kendra for personalized advice",
                    `Follow up with photo in 7 days`,
                ].filter(Boolean),
                followUpDays: aiResult.severity === "high" ? 5 : 7,
            };
        } else {
            // Local fallback (or Python Agent fallback)
            treatment = getTreatment(aiResult.disease);
            
            // If the Python Agent provided a Gemini morphological diagnosis, append it
            if (aiResult.agentDiagnosis) {
                const combinedActions = [
                    ...treatment.recommendedActions,
                    "---",
                    "AI Analysis:",
                    aiResult.agentDiagnosis
                ];
                treatment.recommendedActions = combinedActions;
            }
        }

        // --- Fetch weather data for this location ---
        const weatherData = await getWeather(location.latitude, location.longitude);

        // --- Translate treatment plan if farmer has a non-English language ---
        let translatedPlan = null;
        let translationLang = null;
        if (farmer.language && farmer.language !== "english" && treatment.treatmentPlan) {
            const translation = await translateText(treatment.treatmentPlan, farmer.language);
            translatedPlan = translation.translatedText;
            translationLang = translation.language;
        }

        // --- Calculate follow-up date ---
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + treatment.followUpDays);

        // --- Save diagnosis to database ---
        const diagnosis = await Diagnosis.create({
            farmer: farmerID,
            field: fieldId,
            imageUrl,
            cropType,
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy || 0,
            },
            isVerified: locationVerified,
            distanceFromField: distanceRounded,
            soilCondition: treatment.soilCondition,
            diseaseDetected: aiResult.disease,
            severity: treatment.severity,
            confidence: aiResult.confidence,
            treatmentPlan: treatment.treatmentPlan,
            treatmentPlanTranslated: translatedPlan,
            translationLanguage: translationLang,
            recommendedAction: treatment.recommendedActions,
            followupDate: followUpDate,
            isFollowup: false,
            previousDiagnosis: null,
            growthScore: null,
            weather: weatherData ? {
                temperature: weatherData.temperature,
                humidity: weatherData.humidity,
                rainfall: weatherData.rainfall,
                windSpeed: weatherData.windSpeed,
                condition: weatherData.condition,
                description: weatherData.description,
            } : undefined,
        });

        // --- Update farmer's Agri-Trust Score (recalculate) ---
        await calculateScore(farmerID);

        // --- Send SMS follow-up reminder (non-blocking) ---
        sendFollowUpReminder(farmer.phone, farmer.name, aiResult.disease, followUpDate)
            .catch(err => console.error("SMS reminder error:", err.message));

        // --- Build the response object ---
        const responseData = {
            message: "Diagnosis created successfully",
            diagnosis: {
                id: diagnosis._id,
                imageUrl: diagnosis.imageUrl,
                diseaseDetected: diagnosis.diseaseDetected,
                severity: diagnosis.severity,
                confidence: diagnosis.confidence,
                soilCondition: diagnosis.soilCondition,
                treatmentPlan: diagnosis.treatmentPlan,
                recommendedAction: diagnosis.recommendedAction,
                followupDate: diagnosis.followupDate,
                locationVerified: diagnosis.isVerified,
                distanceFromField: diagnosis.distanceFromField,
                weather: diagnosis.weather || null,
                aiMock: aiResult.isMock || false,
            },
            disclaimer: {
                message: "This diagnosis is AI-generated and based on general guidelines from ICAR and KVK extension services. It is meant for guidance only and should NOT be treated as a substitute for professional agricultural advice.",
                source: "Treatment recommendations based on ICAR (Indian Council of Agricultural Research) and Krishi Vigyan Kendra published guidelines.",
                advice: "For critical decisions, always consult your local KVK expert, agricultural officer, or certified agronomist before applying any treatment.",
            },
        };

        // --- Translate entire response if farmer prefers non-English language ---
        // Priority: request body language > farmer's saved language > english
        const farmerLang = req.body.language || farmer.language || "english";
        if (farmerLang !== "english") {
            try {
                console.log(`🌐 Translating full response to ${farmerLang}...`);
                responseData.diagnosis = await translateObject(responseData.diagnosis, farmerLang);
                responseData.disclaimer = await translateObject(responseData.disclaimer, farmerLang);
                responseData.message = (await translateObject({ text: responseData.message }, farmerLang)).text || responseData.message;
                responseData.language = farmerLang;
            } catch (err) {
                console.error("Translation error (non-blocking):", err.message);
                responseData.language = "english";
            }
        } else {
            responseData.language = "english";
        }

        return res.status(201).json(responseData);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * GET /api/diagnosis
 * Get all diagnoses for the logged-in farmer.
 * Supports optional query params: ?cropType=wheat&fieldId=xxx
 */
export const getDiagnoses = async (req, res) => {
    try {
        const farmerID = req.farmerID;
        const filter = { farmer: farmerID };

        // Optional filters
        if (req.query.cropType) filter.cropType = req.query.cropType;
        if (req.query.fieldId) filter.field = req.query.fieldId;

        const diagnoses = await Diagnosis.find(filter)
            .sort({ createdAt: -1 })
            .populate("field", "fieldName currentCrop location");

        return res.status(200).json({
            count: diagnoses.length,
            diagnoses,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * GET /api/diagnosis/:id
 * Get a single diagnosis by ID.
 */
export const getDiagnosisById = async (req, res) => {
    try {
        const diagnosis = await Diagnosis.findOne({
            _id: req.params.id,
            farmer: req.farmerID,
        }).populate("field", "fieldName currentCrop location")
          .populate("previousDiagnosis", "imageUrl diseaseDetected severity createdAt");

        if (!diagnosis) {
            return res.status(404).json({ message: "Diagnosis not found" });
        }

        return res.status(200).json({ diagnosis });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * POST /api/diagnosis/:id/follow-up
 * Upload a follow-up photo to compare with a previous diagnosis.
 * 
 * Expects form-data with:
 *   - image (file)
 *   - location (JSON string: { latitude, longitude, accuracy })
 */
export const createFollowUp = async (req, res) => {
    try {
        const farmerID = req.farmerID;
        const originalId = req.params.id;
        const location = JSON.parse(req.body.location);

        // --- Find the original diagnosis ---
        const original = await Diagnosis.findOne({ _id: originalId, farmer: farmerID });
        if (!original) {
            return res.status(404).json({ message: "Original diagnosis not found" });
        }

        // --- Check image was uploaded ---
        if (!req.file) {
            return res.status(400).json({ message: "Follow-up image is required" });
        }
        const imageUrl = req.file.path || req.file.secure_url || req.file.url;

        // --- Fetch farmer and field ---
        const farmer = await Farmer.findById(farmerID);
        const field = await Field.findById(original.field);
        if (!field) {
            return res.status(404).json({ message: "Original field not found" });
        }

        // --- GPS Verification ---
        const distance = calculateDistance(
            field.location.latitude,
            field.location.longitude,
            location.latitude,
            location.longitude
        );
        const distanceRounded = Math.round(distance);
        const locationVerified = distance <= MAX_FIELD_DISTANCE;

        if (!locationVerified) {
            return res.status(403).json({
                message: "Location verification failed for follow-up",
                distanceFromField: distanceRounded,
            });
        }

        // --- AI analysis on follow-up image ---
        const aiResult = await analyzeImage(imageUrl, original.cropType || "unknown");
        const treatment = getTreatment(aiResult.disease);
        
        if (aiResult.agentDiagnosis) {
            treatment.recommendedActions = [
                ...treatment.recommendedActions,
                "---",
                "AI Analysis:",
                aiResult.agentDiagnosis
            ];
        }

        // --- Fetch weather ---
        const weatherData = await getWeather(location.latitude, location.longitude);


        // --- Calculate growth/improvement score ---
        // Compare severity: if original was high and now low → big improvement
        const severityMap = { high: 1, medium: 2, low: 3 };
        const originalSev = severityMap[original.severity] || 1;
        const currentSev = severityMap[treatment.severity] || 1;

        let growthScore = 0;
        if (aiResult.disease.toLowerCase() === "healthy") {
            growthScore = 100; // Full recovery
        } else if (currentSev > originalSev) {
            growthScore = Math.min(90, 50 + (currentSev - originalSev) * 20); // Improved
        } else if (currentSev === originalSev) {
            growthScore = 40; // No change
        } else {
            growthScore = Math.max(10, 30 - (originalSev - currentSev) * 10); // Got worse
        }

        // Also factor in confidence difference
        if (aiResult.confidence < original.confidence && aiResult.disease === original.diseaseDetected) {
            // Same disease but lower confidence = might be improving
            growthScore = Math.min(100, growthScore + 10);
        }

        // --- Follow-up date ---
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + treatment.followUpDays);

        // --- Save follow-up diagnosis ---
        const followUp = await Diagnosis.create({
            farmer: farmerID,
            field: original.field,
            imageUrl,
            cropType: original.cropType,
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy || 0,
            },
            isVerified: locationVerified,
            distanceFromField: distanceRounded,
            soilCondition: treatment.soilCondition,
            diseaseDetected: aiResult.disease,
            severity: treatment.severity,
            confidence: aiResult.confidence,
            treatmentPlan: treatment.treatmentPlan,
            recommendedAction: treatment.recommendedActions,
            followupDate: followUpDate,
            isFollowup: true,
            previousDiagnosis: original._id,
            growthScore,
            weather: weatherData ? {
                temperature: weatherData.temperature,
                humidity: weatherData.humidity,
                rainfall: weatherData.rainfall,
                windSpeed: weatherData.windSpeed,
                condition: weatherData.condition,
                description: weatherData.description,
            } : undefined,
        });

        // --- Recalculate farmer score ---
        await calculateScore(farmerID);

        const responseData = {
            message: "Follow-up diagnosis created",
            followUp: {
                id: followUp._id,
                diseaseDetected: followUp.diseaseDetected,
                severity: followUp.severity,
                confidence: followUp.confidence,
                growthScore,
                previousDisease: original.diseaseDetected,
                previousSeverity: original.severity,
                improvement: growthScore >= 50 ? "Improving ✅" : growthScore >= 30 ? "Stable ⚠️" : "Worsening ❌",
                treatmentPlan: followUp.treatmentPlan,
                recommendedAction: followUp.recommendedAction,
                followupDate: followUp.followupDate,
                weather: followUp.weather || null,
            },
        };

        const farmerLang = req.body.language || farmer.language || "english";
        if (farmerLang !== "english") {
            try {
                responseData.followUp = await translateObject(responseData.followUp, farmerLang);
                responseData.message = (await translateObject({ text: responseData.message }, farmerLang)).text || responseData.message;
                responseData.language = farmerLang;
            } catch (err) {
                console.error("Translation error:", err.message);
                responseData.language = "english";
            }
        } else {
            responseData.language = "english";
        }

        return res.status(201).json(responseData);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
