/**
 * AI Service — Plant Disease Detection
 * 
 * Supports two providers:
 *   1. Plant.id API (recommended) — set PLANT_ID_API_KEY in .env
 *      - More accurate, returns treatment info, covers 1000+ diseases
 *      - 100 free credits/day at https://admin.kindwise.com/
 *   
 *   2. Hugging Face (fallback) — set HUGGINGFACE_API_TOKEN in .env
 *      - PlantVillage model, 38 disease classes
 * 
 * If neither is configured, falls back to mock mode for development.
 */

const PLANT_ID_URL = "https://crop.kindwise.com/api/v1/identification";
const HF_API_URL = "https://router.huggingface.co/hf-inference/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification";

/**
 * Analyze a crop image for disease detection.
 * @param {string} imageUrl - Cloudinary URL of the crop image
 * @returns {Object} { disease, confidence, severity, treatment, isMock }
 */
export async function analyzeImage(imageUrl, cropType = "unknown") {
    // Priority 1: Local Python ML Agent (Port 8000)
    try {
        return await analyzeWithPythonAgent(imageUrl, cropType);
    } catch (error) {
        console.error("Python ML Agent error:", error.message);
        console.log("⚠️ Python ML agent is down or failed. Falling back to Plant.id API...");
        // Fall through
    }

    // Priority 2: Plant.id API
    const plantIdKey = process.env.PLANT_ID_API_KEY;
    if (plantIdKey) {
        try {
            return await analyzeWithPlantId(imageUrl, plantIdKey);
        } catch (error) {
            console.error("Plant.id error:", error.message);
            // Fall through to HuggingFace
        }
    }

    // Priority 3: Hugging Face
    const hfToken = process.env.HUGGINGFACE_API_TOKEN;
    if (hfToken) {
        try {
            return await analyzeWithHuggingFace(imageUrl, hfToken);
        } catch (error) {
            console.error("HuggingFace error:", error.message);
            // Fall through to mock
        }
    }

    // Priority 3: Mock mode
    console.log("⚠️  No AI API configured — using mock prediction");
    return getMockPrediction();
}

// =============================================
// LOCAL PYTHON ML AGENT (Priority 1)
// =============================================

async function analyzeWithPythonAgent(imageUrl, cropType) {
    console.log(`🌿 Calling local Python Agent for crop: ${cropType}...`);

    const agentUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    const response = await fetch(`${agentUrl}/diagnose`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            image_url: imageUrl,
            crop_name: cropType,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python Agent returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // If crop verification failed but we still got a diagnosis, use it anyway
    if (data.is_verified_crop === false) {
        if (data.diagnosis) {
            console.log(`⚠️ Crop verification soft-fail (score: ${data.similarity_score}), but diagnosis available — using it.`);
        } else {
            throw new Error(`Crop verification failed: ${data.message}`);
        }
    }

    let diseaseName = "Unknown";
    let confidence = 0;

    // The agent returns disease=None if it's healthy or if it couldn't find a match but saw symptoms
    if (data.disease) {
        diseaseName = data.disease.disease_name;
        confidence = Math.round(data.disease.confidence * 100);
    } else if (data.diagnosis && data.diagnosis.toLowerCase().includes("healthy")) {
        diseaseName = "Healthy";
        confidence = 95;
    }

    let severity = "low";
    if (confidence >= 70 && diseaseName !== "Healthy") severity = "high";
    else if (confidence >= 40 && diseaseName !== "Healthy") severity = "medium";

    // Attach the gemini diagnosis to the response object so the controller can use it
    return {
        disease: diseaseName,
        confidence,
        severity,
        provider: "python_agent",
        agentDiagnosis: data.diagnosis, // The raw text from Gemini
        isMock: false,
    };
}

// =============================================
// PLANT.ID API (Priority 2)
// =============================================

async function analyzeWithPlantId(imageUrl, apiKey) {
    console.log("🌿 Calling Crop Health API...");

    // Request health assessment with treatment details
    const url = `${PLANT_ID_URL}?details=treatment,description,common_names,local_name`;
    
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Api-Key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            images: [imageUrl],
            similar_images: true,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Crop Health API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Debug: log summary only (not the full response)
    const topDisease = data.result?.disease?.suggestions?.[0];
    console.log(`🔍 Crop Health result: ${topDisease?.name || "unknown"} (${Math.round((topDisease?.probability || 0) * 100)}% confidence)`);
    
    return parsePlantIdResponse(data);
}

function parsePlantIdResponse(data) {
    const result = data.result;

    // Check if plant is healthy
    if (result.is_healthy && result.is_healthy.binary) {
        return {
            disease: "Healthy",
            confidence: Math.round(result.is_healthy.probability * 100),
            severity: "low",
            isHealthy: true,
            treatment: null,
            provider: "plant.id",
            isMock: false,
        };
    }

    // Get the top disease suggestion
    const diseases = result.disease?.suggestions || [];
    if (diseases.length === 0) {
        return {
            disease: "Unknown",
            confidence: 0,
            severity: "medium",
            treatment: null,
            provider: "plant.id",
            isMock: false,
        };
    }

    const topDisease = diseases[0];
    const probability = Math.round(topDisease.probability * 100);

    // Map probability to severity
    let severity = "low";
    if (probability >= 70) severity = "high";
    else if (probability >= 40) severity = "medium";

    // Extract treatment details if available
    const details = topDisease.details || {};
    const treatment = details.treatment || null;

    // Build treatment info from Plant.id's own treatment data
    let treatmentFromApi = null;
    if (treatment) {
        const parts = [];
        if (treatment.chemical) parts.push(`Chemical: ${treatment.chemical}`);
        if (treatment.biological) parts.push(`Biological: ${treatment.biological}`);
        if (treatment.prevention) parts.push(`Prevention: ${treatment.prevention}`);
        treatmentFromApi = parts.join(" | ");
    }

    return {
        disease: topDisease.name,
        confidence: probability,
        severity,
        isHealthy: false,
        treatment: treatmentFromApi,
        treatmentDetails: treatment,  // raw object { chemical, biological, prevention }
        description: details.description || null,
        similarImages: topDisease.similar_images || [],
        allSuggestions: diseases.slice(0, 3).map(d => ({
            name: d.name,
            probability: Math.round(d.probability * 100),
        })),
        provider: "plant.id",
        isMock: false,
    };
}

// =============================================
// HUGGING FACE (Fallback)
// =============================================

async function analyzeWithHuggingFace(imageUrl, token) {
    console.log("🤖 Calling Hugging Face API...");

    // Fetch the image from Cloudinary
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    // Send to Hugging Face
    const response = await fetch(HF_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/octet-stream",
        },
        body: Buffer.from(imageBuffer),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HF API error: ${errorText}`);
    }

    const predictions = await response.json();
    return parseHFResponse(predictions);
}

function parseHFResponse(predictions) {
    if (!Array.isArray(predictions) || predictions.length === 0) {
        return { disease: "Unknown", confidence: 0, severity: "medium", provider: "huggingface", isMock: false };
    }

    const top = predictions[0];
    const rawLabel = top.label || "Unknown";
    const confidence = Math.round((top.score || 0) * 100);

    // Parse label: "Tomato___Early_blight" → "Early blight"
    const parts = rawLabel.split("___");
    const diseasePart = parts.length > 1 ? parts[1] : parts[0];
    const disease = diseasePart.replace(/_/g, " ").trim();

    let severity = "low";
    if (confidence >= 70) severity = "high";
    else if (confidence >= 40) severity = "medium";

    return {
        disease,
        confidence,
        severity,
        provider: "huggingface",
        isMock: false,
    };
}

// =============================================
// MOCK MODE (Development)
// =============================================

function getMockPrediction() {
    const diseases = [
        { disease: "Leaf Blight", severity: "high" },
        { disease: "Powdery Mildew", severity: "medium" },
        { disease: "Rust", severity: "medium" },
        { disease: "Bacterial Spot", severity: "high" },
        { disease: "Early Blight", severity: "high" },
        { disease: "Healthy", severity: "low" },
    ];

    const pick = diseases[Math.floor(Math.random() * diseases.length)];
    const confidence = Math.floor(Math.random() * 30) + 60;

    return {
        disease: pick.disease,
        confidence,
        severity: pick.severity,
        provider: "mock",
        isMock: true,
    };
}
