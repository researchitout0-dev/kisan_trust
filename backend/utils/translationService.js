/**
 * Translation Service
 * 
 * Translates treatment plans to regional Indian languages.
 * 
 * Supports two backends:
 *   1. Bhashini API (Government of India) — set BHASHINI_API_KEY and BHASHINI_USER_ID
 *   2. Google Translate (free library) — works out of the box, no key needed
 * 
 * Currently uses a simple dictionary-based approach for common terms
 * and Google's free translate endpoint as fallback.
 */

const GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";

// Language codes
const LANGUAGE_CODES = {
    hindi: "hi",
    marathi: "mr",
    tamil: "ta",
    telugu: "te",
    kannada: "kn",
    bengali: "bn",
    punjabi: "pa",
    gujarati: "gu",
    odia: "or",
    malayalam: "ml",
    english: "en",
};

/**
 * Translate text to a target language.
 * @param {string} text - Text to translate (in English)
 * @param {string} targetLang - Language name ("hindi", "marathi", etc.) or code ("hi", "mr")
 * @returns {Object} { translatedText, language, method }
 */
export async function translateText(text, targetLang) {
    if (!text || !targetLang) {
        return { translatedText: text, language: "english", method: "none" };
    }

    // Resolve language code
    const langCode = LANGUAGE_CODES[targetLang.toLowerCase()] || targetLang.toLowerCase();

    if (langCode === "en") {
        return { translatedText: text, language: "english", method: "none" };
    }

    // Try Bhashini first (if configured)
    const bhashiniKey = process.env.BHASHINI_API_KEY;
    if (bhashiniKey) {
        try {
            const result = await translateWithBhashini(text, langCode);
            if (result) return { translatedText: result, language: targetLang, method: "bhashini" };
        } catch (error) {
            console.error("Bhashini error, falling back:", error.message);
        }
    }

    // Fallback: Google Translate free endpoint
    try {
        const result = await translateWithGoogle(text, langCode);
        if (result) return { translatedText: result, language: targetLang, method: "google" };
    } catch (error) {
        console.error("Google Translate error:", error.message);
    }

    // Final fallback: return original English text
    return { translatedText: text, language: "english", method: "fallback" };
}

/**
 * Bhashini API translation (Government of India)
 * Free for Indian developers — supports all major Indian languages.
 */
async function translateWithBhashini(text, targetLangCode) {
    const apiKey = process.env.BHASHINI_API_KEY;
    const userId = process.env.BHASHINI_USER_ID;

    if (!apiKey || !userId) return null;

    const response = await fetch("https://dhruva-api.bhashini.gov.in/services/inference/pipeline", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": apiKey,
            "userID": userId,
        },
        body: JSON.stringify({
            pipelineTasks: [{
                taskType: "translation",
                config: {
                    language: {
                        sourceLanguage: "en",
                        targetLanguage: targetLangCode,
                    },
                },
            }],
            inputData: {
                input: [{ source: text }],
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`Bhashini API returned ${response.status}`);
    }

    const data = await response.json();
    return data?.pipelineResponse?.[0]?.output?.[0]?.target || null;
}

/**
 * Google Translate free endpoint.
 * No API key needed — uses the free translation endpoint.
 * Rate-limited but works well for hackathons.
 */
async function translateWithGoogle(text, targetLangCode) {
    // Split long text into chunks (Google free endpoint has limits)
    const maxLength = 4000;
    if (text.length > maxLength) {
        const chunks = splitText(text, maxLength);
        const results = [];
        for (const chunk of chunks) {
            const translated = await googleTranslateChunk(chunk, targetLangCode);
            results.push(translated);
        }
        return results.join(" ");
    }

    return googleTranslateChunk(text, targetLangCode);
}

async function googleTranslateChunk(text, targetLangCode) {
    const params = new URLSearchParams({
        client: "gtx",
        sl: "en",
        tl: targetLangCode,
        dt: "t",
        q: text,
    });

    const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params}`);

    if (!response.ok) {
        throw new Error(`Google Translate returned ${response.status}`);
    }

    const data = await response.json();

    // Response format: [[["translated text", "original text", ...]]]
    if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map(item => item[0]).join("");
    }

    return null;
}

function splitText(text, maxLength) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let current = "";

    for (const sentence of sentences) {
        if ((current + sentence).length > maxLength) {
            if (current) chunks.push(current.trim());
            current = sentence;
        } else {
            current += " " + sentence;
        }
    }
    if (current) chunks.push(current.trim());
    return chunks;
}

/**
 * Translate all string values in an object recursively.
 * Skips keys that should not be translated (IDs, URLs, dates, numbers).
 * 
 * @param {Object} obj - The object to translate
 * @param {string} targetLang - Language name ("hindi", "marathi") or code ("hi", "mr")
 * @returns {Object} New object with all string values translated
 */
export async function translateObject(obj, targetLang) {
    if (!obj || !targetLang) return obj;

    const langCode = LANGUAGE_CODES[targetLang.toLowerCase()] || targetLang.toLowerCase();
    if (langCode === "en") return obj;

    // Keys to skip (IDs, URLs, dates, technical fields)
    const skipKeys = new Set([
        "id", "_id", "imageUrl", "followupDate", "createdAt", "updatedAt",
        "translationLanguage", "provider", "method", "source",
        "fieldId", "farmerId", "loanId", "token",
    ]);

    const translated = {};

    for (const [key, value] of Object.entries(obj)) {
        if (skipKeys.has(key)) {
            translated[key] = value;
        } else if (typeof value === "string" && value.length > 0) {
            // Skip URLs, dates, hex IDs
            if (value.startsWith("http") || value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^[a-f0-9]{24}$/)) {
                translated[key] = value;
            } else {
                try {
                    const result = await translateText(value, targetLang);
                    translated[key] = result.translatedText;
                } catch {
                    translated[key] = value;
                }
            }
        } else if (Array.isArray(value)) {
            translated[key] = await translateArray(value, targetLang);
        } else if (typeof value === "object" && value !== null) {
            translated[key] = await translateObject(value, targetLang);
        } else {
            translated[key] = value; // numbers, booleans, null
        }
    }

    return translated;
}

/**
 * Translate all strings in an array.
 * @param {Array} arr - Array of strings or objects
 * @param {string} targetLang - Language name or code
 * @returns {Array} Translated array
 */
export async function translateArray(arr, targetLang) {
    if (!Array.isArray(arr)) return arr;

    const results = [];
    for (const item of arr) {
        if (typeof item === "string") {
            try {
                const result = await translateText(item, targetLang);
                results.push(result.translatedText);
            } catch {
                results.push(item);
            }
        } else if (typeof item === "object" && item !== null) {
            results.push(await translateObject(item, targetLang));
        } else {
            results.push(item);
        }
    }
    return results;
}

/**
 * Translate multiple strings in a single batch (more efficient).
 * Joins all strings with a separator, translates once, then splits back.
 * 
 * @param {string[]} texts - Array of strings to translate
 * @param {string} targetLang - Language name or code
 * @returns {string[]} Array of translated strings
 */
export async function translateBatch(texts, targetLang) {
    if (!texts || texts.length === 0) return texts;

    const langCode = LANGUAGE_CODES[targetLang.toLowerCase()] || targetLang.toLowerCase();
    if (langCode === "en") return texts;

    // Use a unique separator that won't appear in normal text
    const separator = " ||| ";
    const combined = texts.join(separator);

    try {
        const result = await translateText(combined, targetLang);
        const translatedParts = result.translatedText.split(/\s*\|\|\|\s*/);
        
        // If splitting didn't work correctly, fall back to individual translations
        if (translatedParts.length !== texts.length) {
            const individual = [];
            for (const text of texts) {
                const r = await translateText(text, targetLang);
                individual.push(r.translatedText);
            }
            return individual;
        }
        return translatedParts;
    } catch {
        return texts;
    }
}

/**
 * Get list of supported languages.
 */
export function getSupportedLanguages() {
    return Object.keys(LANGUAGE_CODES);
}
