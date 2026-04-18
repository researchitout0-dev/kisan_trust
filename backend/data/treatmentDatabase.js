/**
 * Treatment database for crop diseases.
 * Maps disease keywords → treatment plan details.
 * 
 * The AI model returns labels like "Bell Pepper with Bacterial Spot" or
 * "Tomato___Early_blight" — the getTreatment() function strips plant names
 * and matches the disease part.
 */

const treatments = {
    "powdery_mildew": {
        disease: "Powdery Mildew",
        severity: "medium",
        soilCondition: "degraded",
        treatmentPlan: "Apply sulfur-based fungicide (Karathane 0.05%) on affected leaves. Remove and destroy heavily infected plant parts. Ensure proper spacing between plants for air circulation. Avoid overhead irrigation. Apply neem oil spray as organic alternative.",
        recommendedActions: [
            "Spray sulfur fungicide early morning or evening",
            "Remove heavily infected leaves and burn them",
            "Increase plant spacing for better airflow",
            "Avoid watering leaves directly — use drip irrigation",
            "Apply neem oil spray every 5 days",
            "Monitor neighboring plants for spread",
            "Follow up with photo in 7 days"
        ],
        followUpDays: 7
    },
    "bacterial_spot": {
        disease: "Bacterial Spot",
        severity: "high",
        soilCondition: "degraded",
        treatmentPlan: "Apply copper-based bactericide (Copper hydroxide or Bordeaux mixture) immediately. Remove and destroy severely infected leaves and fruits. Avoid overhead watering — use drip irrigation. Ensure proper plant spacing for air circulation. Rotate crops next season — do not plant same family crops.",
        recommendedActions: [
            "Spray copper hydroxide or Bordeaux mixture immediately",
            "Remove and destroy all severely infected plant parts",
            "Switch to drip irrigation — avoid wetting leaves",
            "Increase plant spacing for better airflow",
            "Avoid working with plants when they are wet",
            "Rotate crops next season — avoid same family (Solanaceae)",
            "Follow up with photo in 5 days"
        ],
        followUpDays: 5
    },
    "leaf_scorch": {
        disease: "Leaf Scorch",
        severity: "medium",
        soilCondition: "degraded",
        treatmentPlan: "Leaf scorch is often caused by fungal infection or environmental stress. Apply fungicide (Captan or Myclobutanil). Ensure adequate watering during dry periods. Mulch around plants to retain soil moisture. Remove severely scorched leaves to prevent spread.",
        recommendedActions: [
            "Apply Captan or Myclobutanil fungicide",
            "Water regularly — deep watering at root zone",
            "Apply organic mulch around base of plants",
            "Remove all severely scorched leaves",
            "Improve soil drainage to prevent waterlogging",
            "Test soil pH and adjust if needed",
            "Follow up with photo in 7 days"
        ],
        followUpDays: 7
    },
    "early_blight": {
        disease: "Early Blight",
        severity: "high",
        soilCondition: "degraded",
        treatmentPlan: "Apply Mancozeb or Chlorothalonil fungicide (0.2%). Remove lower infected leaves immediately. Mulch around plants to prevent soil splash. Ensure proper spacing. Rotate crops — avoid planting tomatoes/potatoes in same spot for 2 years.",
        recommendedActions: [
            "Spray Mancozeb or Chlorothalonil at 0.2%",
            "Remove infected lower leaves immediately",
            "Mulch soil surface to prevent rain splash",
            "Stake plants to improve air circulation",
            "Water at base, never on foliage",
            "Rotate crops for at least 2 seasons",
            "Follow up with photo in 5 days"
        ],
        followUpDays: 5
    },
    "late_blight": {
        disease: "Late Blight",
        severity: "high",
        soilCondition: "poor",
        treatmentPlan: "URGENT: Late blight spreads rapidly. Apply Metalaxyl + Mancozeb (Ridomil Gold) immediately. Remove and destroy ALL infected plant material — do NOT compost. Check neighboring fields. This disease can destroy entire crop within days if untreated.",
        recommendedActions: [
            "Spray Ridomil Gold (Metalaxyl + Mancozeb) IMMEDIATELY",
            "Remove and BURN all infected plants",
            "Do NOT compost infected material",
            "Check all neighboring plants for infection",
            "Warn neighboring farmers",
            "Apply preventive spray on healthy plants",
            "Follow up with photo in 3 days — URGENT"
        ],
        followUpDays: 3
    },
    "leaf_blight": {
        disease: "Leaf Blight",
        severity: "high",
        soilCondition: "degraded",
        treatmentPlan: "Apply Mancozeb (0.25%) or Copper oxychloride spray immediately. Remove all infected leaves and destroy them away from the field. Ensure proper drainage to avoid waterlogging. Rotate crops next season to break disease cycle.",
        recommendedActions: [
            "Spray Mancozeb 0.25% solution immediately",
            "Remove and destroy all infected plant material",
            "Improve field drainage — prevent waterlogging",
            "Do not plant same crop in this field next season",
            "Apply potassium fertilizer to strengthen plants",
            "Monitor daily for 3 days for rapid spread",
            "Follow up with photo in 5 days"
        ],
        followUpDays: 5
    },
    "leaf_mold": {
        disease: "Leaf Mold",
        severity: "medium",
        soilCondition: "degraded",
        treatmentPlan: "Improve ventilation around plants immediately. Apply Chlorothalonil or Mancozeb fungicide. Reduce humidity by improving air circulation and avoiding overhead watering. Remove affected leaves. Most common in greenhouses — open vents if applicable.",
        recommendedActions: [
            "Improve air circulation — open greenhouse vents or increase spacing",
            "Spray Chlorothalonil or Mancozeb fungicide",
            "Avoid overhead watering — use drip irrigation",
            "Remove infected leaves carefully",
            "Reduce humidity around plants",
            "Prune lower branches for better airflow",
            "Follow up with photo in 7 days"
        ],
        followUpDays: 7
    },
    "septoria_leaf_spot": {
        disease: "Septoria Leaf Spot",
        severity: "medium",
        soilCondition: "degraded",
        treatmentPlan: "Apply Chlorothalonil or Mancozeb fungicide. Remove infected lower leaves. Mulch around plants to prevent soil splash. Avoid overhead irrigation. Practice crop rotation — do not grow same crop family for 2 years.",
        recommendedActions: [
            "Spray Chlorothalonil or Mancozeb fungicide",
            "Remove all infected lower leaves",
            "Apply mulch to prevent soil splashing onto leaves",
            "Water plants at base — avoid wetting foliage",
            "Stake or cage plants to improve air circulation",
            "Rotate crops for at least 2 years",
            "Follow up with photo in 7 days"
        ],
        followUpDays: 7
    },
    "target_spot": {
        disease: "Target Spot",
        severity: "medium",
        soilCondition: "degraded",
        treatmentPlan: "Apply Mancozeb or Azoxystrobin fungicide. Remove heavily spotted leaves. Ensure proper plant spacing. Avoid overhead watering. Improve air circulation by pruning.",
        recommendedActions: [
            "Spray Mancozeb or Azoxystrobin fungicide",
            "Remove leaves with heavy target-spot symptoms",
            "Improve airflow — prune dense growth",
            "Water at root level only",
            "Maintain balanced fertilization",
            "Do not work with wet plants",
            "Follow up with photo in 7 days"
        ],
        followUpDays: 7
    },
    "mosaic_virus": {
        disease: "Mosaic Virus",
        severity: "high",
        soilCondition: "good",
        treatmentPlan: "No chemical cure for viral diseases. Remove and destroy all infected plants immediately. Control aphid/whitefly vectors with insecticide (Imidacloprid). Disinfect tools. Plant virus-resistant varieties next season. Wash hands before handling healthy plants.",
        recommendedActions: [
            "Remove and DESTROY all infected plants immediately",
            "Control aphids/whiteflies with Imidacloprid",
            "Disinfect all garden tools with 10% bleach solution",
            "Wash hands before touching healthy plants",
            "Plant resistant varieties next season",
            "Control weeds — they can harbor the virus",
            "Follow up with photo in 5 days"
        ],
        followUpDays: 5
    },
    "yellow_leaf_curl_virus": {
        disease: "Yellow Leaf Curl Virus",
        severity: "high",
        soilCondition: "good",
        treatmentPlan: "No chemical cure available. Remove infected plants. Control whitefly vectors aggressively using yellow sticky traps and Imidacloprid insecticide. Use virus-resistant varieties. Cover young plants with fine mesh to exclude whiteflies.",
        recommendedActions: [
            "Remove and destroy infected plants",
            "Install yellow sticky traps around healthy plants",
            "Spray Imidacloprid to control whiteflies",
            "Cover young plants with insect-proof mesh",
            "Plant resistant varieties next season",
            "Remove weeds that harbor whiteflies",
            "Follow up with photo in 5 days"
        ],
        followUpDays: 5
    },
    "spider_mites": {
        disease: "Spider Mites",
        severity: "medium",
        soilCondition: "good",
        treatmentPlan: "Spray plants with strong water jet to dislodge mites. Apply miticide (Abamectin or Spiromesifen). Apply neem oil spray as organic option. Increase humidity around plants. Release predatory mites (Phytoseiulus) for biological control.",
        recommendedActions: [
            "Spray strong water jet on undersides of leaves",
            "Apply Abamectin or Spiromesifen miticide",
            "Use neem oil spray as organic alternative",
            "Increase humidity — mist plants regularly",
            "Remove heavily infested leaves",
            "Release predatory mites for biocontrol",
            "Follow up with photo in 5 days"
        ],
        followUpDays: 5
    },
    "rust": {
        disease: "Rust",
        severity: "medium",
        soilCondition: "good",
        treatmentPlan: "Apply Propiconazole (Tilt 25 EC) at 0.1% concentration. Remove initial rust-affected leaves to prevent spread. Plant resistant varieties next season. Maintain balanced fertilization — excess nitrogen worsens rust.",
        recommendedActions: [
            "Spray Propiconazole (Tilt 25 EC) at 0.1%",
            "Remove initial infected leaves carefully",
            "Reduce nitrogen fertilizer application",
            "Ensure balanced potassium and phosphorus levels",
            "Plant rust-resistant varieties next season",
            "Scout field edges — rust often starts there",
            "Follow up with photo in 7 days"
        ],
        followUpDays: 7
    },
    "common_rust": {
        disease: "Common Rust",
        severity: "medium",
        soilCondition: "good",
        treatmentPlan: "Apply Propiconazole or Mancozeb fungicide at early stages. Remove and destroy heavily rusted leaves. Plant rust-resistant varieties. Avoid excess nitrogen fertilization. Monitor crop closely — rust spreads fast in humid conditions.",
        recommendedActions: [
            "Spray Propiconazole or Mancozeb at early stage",
            "Remove heavily rusted leaves",
            "Reduce nitrogen fertilizer",
            "Improve air circulation in crop canopy",
            "Plant resistant hybrids next season",
            "Monitor during humid weather closely",
            "Follow up with photo in 7 days"
        ],
        followUpDays: 7
    },
    "bacterial_wilt": {
        disease: "Bacterial Wilt",
        severity: "high",
        soilCondition: "poor",
        treatmentPlan: "No chemical cure available — focus on prevention. Remove and destroy wilted plants immediately. Do not compost infected material. Apply Trichoderma viride (bio-agent) to soil. Rotate with non-host crops (cereals) for at least 3 seasons.",
        recommendedActions: [
            "Uproot and destroy wilted plants immediately",
            "Do NOT compost infected plants — burn them",
            "Apply Trichoderma viride bio-agent to soil",
            "Improve soil drainage in affected area",
            "Rotate with cereal crops for 3 seasons",
            "Disinfect tools used on infected plants",
            "Follow up with photo in 5 days"
        ],
        followUpDays: 5
    },
    "downy_mildew": {
        disease: "Downy Mildew",
        severity: "medium",
        soilCondition: "degraded",
        treatmentPlan: "Apply Metalaxyl + Mancozeb (Ridomil Gold) at 0.2% concentration. Ensure proper air circulation between plants. Avoid overhead watering. Remove severely infected leaves. Apply copper-based fungicide as preventive on healthy plants.",
        recommendedActions: [
            "Spray Ridomil Gold (Metalaxyl + Mancozeb) at 0.2%",
            "Improve air circulation — wider plant spacing",
            "Switch to drip irrigation if possible",
            "Remove severely infected lower leaves",
            "Apply copper fungicide on healthy plants nearby",
            "Avoid working in field when plants are wet",
            "Follow up with photo in 7 days"
        ],
        followUpDays: 7
    },
    "leaf_spot": {
        disease: "Leaf Spot",
        severity: "low",
        soilCondition: "good",
        treatmentPlan: "Apply Carbendazim (Bavistin) at 0.1% concentration. Remove spotted leaves to reduce inoculum. Maintain proper plant nutrition. Avoid excess watering. Usually not critical if caught early.",
        recommendedActions: [
            "Spray Carbendazim (Bavistin) at 0.1%",
            "Remove leaves with heavy spotting",
            "Maintain balanced fertilization",
            "Avoid overhead watering",
            "Ensure good field sanitation",
            "Monitor weekly for spread",
            "Follow up with photo in 10 days"
        ],
        followUpDays: 10
    },
    "root_rot": {
        disease: "Root Rot",
        severity: "high",
        soilCondition: "poor",
        treatmentPlan: "Improve soil drainage immediately. Apply Trichoderma harzianum bio-agent to soil around healthy plants. Remove severely affected plants. Add well-decomposed organic matter to improve soil structure. Avoid waterlogging at all costs.",
        recommendedActions: [
            "Create drainage channels around affected area",
            "Apply Trichoderma harzianum to soil",
            "Remove and destroy plants with severe root rot",
            "Add well-decomposed FYM/compost to improve drainage",
            "Reduce irrigation frequency",
            "Raise beds for future planting",
            "Follow up with photo in 7 days"
        ],
        followUpDays: 7
    },
    "aphid_infestation": {
        disease: "Aphid Infestation",
        severity: "medium",
        soilCondition: "good",
        treatmentPlan: "Spray neem oil (5ml per liter) or Imidacloprid (0.3ml per liter) on undersides of leaves. Release ladybugs as biological control. Remove severely infested shoots. Avoid excess nitrogen which attracts aphids.",
        recommendedActions: [
            "Spray neem oil solution (5ml/liter) on leaf undersides",
            "Use yellow sticky traps to monitor population",
            "Release ladybugs or lacewings for biocontrol",
            "Remove and destroy heavily infested shoots",
            "Reduce nitrogen fertilizer application",
            "Spray early morning for best results",
            "Follow up with photo in 5 days"
        ],
        followUpDays: 5
    },
    "black_rot": {
        disease: "Black Rot",
        severity: "high",
        soilCondition: "degraded",
        treatmentPlan: "Apply Mancozeb or Captan fungicide immediately. Remove and destroy all infected fruits and leaves. Prune infected branches well below visible symptoms. Ensure good air circulation. Do not compost infected material.",
        recommendedActions: [
            "Spray Mancozeb or Captan fungicide",
            "Remove ALL infected fruits, leaves, and branches",
            "Prune branches 15cm below visible infection",
            "Improve air circulation by pruning",
            "Clean up fallen debris from around plants",
            "Disinfect pruning tools between cuts",
            "Follow up with photo in 5 days"
        ],
        followUpDays: 5
    },
    "scab": {
        disease: "Scab",
        severity: "medium",
        soilCondition: "degraded",
        treatmentPlan: "Apply fungicide (Mancozeb or Myclobutanil) during wet weather. Remove fallen infected leaves — they harbor spores. Prune to improve air circulation. Plant scab-resistant varieties next season.",
        recommendedActions: [
            "Spray Mancozeb or Myclobutanil fungicide",
            "Remove all fallen leaves from ground",
            "Prune to improve air circulation in canopy",
            "Avoid overhead irrigation",
            "Plant resistant varieties next season",
            "Apply lime sulfur as dormant spray",
            "Follow up with photo in 7 days"
        ],
        followUpDays: 7
    },
    "cedar_rust": {
        disease: "Cedar Rust",
        severity: "medium",
        soilCondition: "good",
        treatmentPlan: "Apply Myclobutanil or Triadimefon fungicide during spring growth. Remove nearby cedar/juniper trees if possible — they are alternate hosts. Plant rust-resistant varieties.",
        recommendedActions: [
            "Spray Myclobutanil or Triadimefon fungicide",
            "Remove galls from nearby cedar/juniper trees",
            "Plant resistant varieties",
            "Apply fungicide preventively in spring",
            "Improve air circulation around trees",
            "Clean up fallen infected leaves",
            "Follow up with photo in 10 days"
        ],
        followUpDays: 10
    },
    "gray_leaf_spot": {
        disease: "Gray Leaf Spot",
        severity: "medium",
        soilCondition: "degraded",
        treatmentPlan: "Apply Azoxystrobin or Pyraclostrobin fungicide. Improve air movement through crop canopy. Plant resistant hybrids. Practice crop rotation — avoid continuous corn/maize. Manage residue by tillage.",
        recommendedActions: [
            "Spray Azoxystrobin or Pyraclostrobin fungicide",
            "Improve air movement in crop canopy",
            "Plant resistant hybrids next season",
            "Rotate crops — no continuous planting",
            "Manage crop residue by tillage",
            "Monitor during warm humid weather",
            "Follow up with photo in 7 days"
        ],
        followUpDays: 7
    },
    "northern_leaf_blight": {
        disease: "Northern Leaf Blight",
        severity: "high",
        soilCondition: "degraded",
        treatmentPlan: "Apply Propiconazole or Azoxystrobin fungicide at first symptoms. Use resistant hybrids. Practice crop rotation with non-host crops. Manage crop residue. Most effective when treated early.",
        recommendedActions: [
            "Spray Propiconazole or Azoxystrobin immediately",
            "Plant resistant hybrids next season",
            "Rotate with non-host crops (legumes, vegetables)",
            "Manage residue through tillage",
            "Apply at early symptom stage for best results",
            "Monitor closely during wet weather",
            "Follow up with photo in 5 days"
        ],
        followUpDays: 5
    },
    "cercospora_leaf_spot": {
        disease: "Cercospora Leaf Spot",
        severity: "medium",
        soilCondition: "degraded",
        treatmentPlan: "Apply Mancozeb or Carbendazim fungicide. Remove infected leaves. Ensure proper spacing for air circulation. Practice crop rotation. Avoid excess nitrogen fertilization.",
        recommendedActions: [
            "Spray Mancozeb or Carbendazim fungicide",
            "Remove and destroy infected leaves",
            "Improve plant spacing for airflow",
            "Rotate crops for 2 seasons",
            "Avoid excess nitrogen fertilizer",
            "Water at root level only",
            "Follow up with photo in 7 days"
        ],
        followUpDays: 7
    },
    "huanglongbing": {
        disease: "Huanglongbing (Citrus Greening)",
        severity: "high",
        soilCondition: "good",
        treatmentPlan: "No cure available. Remove and destroy infected trees immediately to prevent spread. Control Asian citrus psyllid vectors aggressively. Apply systemic insecticide (Imidacloprid). Plant certified disease-free nursery stock.",
        recommendedActions: [
            "Remove and destroy infected trees",
            "Control citrus psyllid with Imidacloprid",
            "Use certified disease-free nursery stock",
            "Monitor traps for citrus psyllid",
            "Apply systemic insecticide quarterly",
            "Report to agricultural authorities",
            "No follow-up possible for removed trees"
        ],
        followUpDays: 14
    },
    "esca": {
        disease: "Esca (Black Measles)",
        severity: "high",
        soilCondition: "degraded",
        treatmentPlan: "No effective chemical cure. Remove and destroy severely affected vines. Protect pruning wounds with fungicidal paste. Delay pruning until dry weather. Retrain new shoots from base if trunk is affected.",
        recommendedActions: [
            "Remove severely affected vines/branches",
            "Seal all pruning wounds with fungicidal paste",
            "Prune only in dry weather",
            "Disinfect pruning tools between plants",
            "Retrain new growth from base",
            "Reduce plant stress — maintain proper watering",
            "Follow up with photo in 14 days"
        ],
        followUpDays: 14
    },
    "healthy": {
        disease: "Healthy",
        severity: "low",
        soilCondition: "good",
        treatmentPlan: "Your crop looks healthy! Continue your current farming practices. Maintain regular watering and balanced fertilization. Keep monitoring for any early signs of disease.",
        recommendedActions: [
            "Continue current care routine",
            "Maintain balanced watering schedule",
            "Apply recommended fertilizers on time",
            "Scout for pests weekly",
            "Keep field clean of weeds",
            "Take next monitoring photo in 14 days"
        ],
        followUpDays: 14
    }
};

/**
 * Extract the disease name from the AI label.
 * AI returns: "Bell Pepper with Bacterial Spot" or "Tomato___Early_Blight"
 * We extract: "bacterial_spot" or "early_blight"
 */
function extractDiseaseName(rawDisease) {
    if (!rawDisease) return "";

    let disease = rawDisease;

    // Handle "Plant with Disease" format
    if (disease.toLowerCase().includes(" with ")) {
        disease = disease.split(/\s+with\s+/i).pop();
    }

    // Handle "Plant___Disease" format
    if (disease.includes("___")) {
        disease = disease.split("___").pop();
    }

    // Normalize: lowercase, replace spaces/special chars with underscores
    return disease.toLowerCase().replace(/[\s-]+/g, "_").trim();
}

/**
 * Look up treatment plan by disease name.
 * Handles AI labels like "Bell Pepper with Bacterial Spot", 
 * "Tomato___Early_Blight", or plain "Powdery Mildew".
 */
export function getTreatment(diseaseName) {
    if (!diseaseName) return getDefaultTreatment();

    const extracted = extractDiseaseName(diseaseName);

    // Try exact match
    if (treatments[extracted]) {
        return { ...treatments[extracted], disease: diseaseName };
    }

    // Try partial match — check if any key is contained in extracted or vice versa
    for (const [diseaseKey, treatment] of Object.entries(treatments)) {
        if (extracted.includes(diseaseKey) || diseaseKey.includes(extracted)) {
            return { ...treatment, disease: diseaseName };
        }
    }

    // Try word-by-word match — at least 2 words must match
    const extractedWords = extracted.split("_").filter(w => w.length > 2);
    for (const [diseaseKey, treatment] of Object.entries(treatments)) {
        const keyWords = diseaseKey.split("_").filter(w => w.length > 2);
        const matches = extractedWords.filter(w => keyWords.includes(w));
        if (matches.length >= 1) {
            return { ...treatment, disease: diseaseName };
        }
    }

    return getDefaultTreatment(diseaseName);
}

function getDefaultTreatment(diseaseName = "Unknown") {
    return {
        disease: diseaseName,
        severity: "medium",
        soilCondition: "unknown",
        treatmentPlan: `Disease "${diseaseName}" detected. Consult a local agricultural expert or Krishi Vigyan Kendra for specific treatment. As immediate action: isolate affected plants, avoid overhead watering, and monitor neighboring plants.`,
        recommendedActions: [
            "Isolate affected plants from healthy ones",
            "Take close-up photos of symptoms for expert consultation",
            "Contact local Krishi Vigyan Kendra (KVK)",
            "Avoid spreading infection through tools or water",
            "Monitor healthy plants daily for similar symptoms",
            "Follow up with photo in 5 days"
        ],
        followUpDays: 5
    };
}

export default treatments;
