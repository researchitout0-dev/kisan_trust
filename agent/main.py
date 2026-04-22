"""
KisanTrust — Crop Disease Detection Microservice

FastAPI app that implements the full pipeline:
  1. Receive image_url + crop_name
  2. Fetch healthy reference images from Cloudinary
  3. Verify crop identity via CLIP feature vectors
  4. Generate morphological diagnosis via Gemini 2.0 Flash
  5. Convert diagnosis to embedding (all-MiniLM-L6-v2)
  6. Match against disease symptom embeddings in MySQL
  7. Return result
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import DiagnoseRequest, DiagnoseResponse, DiseaseMatch
from services.cloudinary_service import get_healthy_image_urls
from services.image_service import verify_crop
from services.diagnosis_service import generate_diagnosis
from services.embedding_service import text_to_embedding
from services.disease_matcher import find_matching_disease

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="KisanTrust Disease Detection",
    description="Crop disease detection via image comparison, AI diagnosis, and symptom embedding matching.",
    version="1.0.0",
  redirect_slashes=False
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/")
async def health():
    return {"status": "ok", "service": "KisanTrust Disease Detection"}


# ---------------------------------------------------------------------------
# Main diagnosis endpoint
# ---------------------------------------------------------------------------
@app.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose(req: DiagnoseRequest):
    """
    Full disease detection pipeline.

    Body:
        image_url  — Cloudinary URL of the uploaded crop image
        crop_name  — name of the crop (e.g. "wheat", "rice")
    """
    crop = req.crop_name.lower().strip()

    # Validate crop name
    if crop not in settings.SUPPORTED_CROPS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported crop '{req.crop_name}'. Supported: {settings.SUPPORTED_CROPS}",
        )

    # ------------------------------------------------------------------
    # Step 1 — Fetch healthy reference images from Cloudinary
    # ------------------------------------------------------------------
    print(f"\n{'='*60}")
    print(f"[pipeline] Starting diagnosis for crop='{crop}'")
    print(f"[pipeline] Uploaded image: {req.image_url}")
    print(f"{'='*60}")

    healthy_urls = get_healthy_image_urls(crop)
    if not healthy_urls:
        print(f"[pipeline] No healthy references found — using single-image diagnosis mode")
        # Skip CLIP verification, go straight to Gemini with just the uploaded image
        is_verified = True
        similarity_score = 1.0
        best_healthy_url = None
    else:
        print(f"[pipeline] Found {len(healthy_urls)} healthy reference image(s)")

        # ------------------------------------------------------------------
        # Step 2 — Verify crop identity via CLIP
        # ------------------------------------------------------------------
        print("[pipeline] Step 2: Verifying crop identity with CLIP …")
        is_verified, similarity_score, best_healthy_url = verify_crop(
            uploaded_url=req.image_url,
            healthy_urls=healthy_urls,
            threshold=settings.CLIP_SIMILARITY_THRESHOLD,
        )
        print(f"[pipeline] Crop verified: {is_verified}  (similarity={similarity_score:.4f})")

    if not is_verified:
        return DiagnoseResponse(
            is_verified_crop=False,
            similarity_score=round(similarity_score, 4),
            diagnosis="",
            disease=None,
            message=(
                f"The uploaded image does not appear to be '{req.crop_name}'. "
                f"Similarity score ({similarity_score:.2f}) is below the "
                f"threshold ({settings.CLIP_SIMILARITY_THRESHOLD}). "
                "Please upload a clearer image of the crop."
            ),
        )

    # ------------------------------------------------------------------
    # Step 3 — Generate morphological diagnosis via Gemini
    # ------------------------------------------------------------------
    print("[pipeline] Step 3: Generating morphological diagnosis via Gemini …")
    try:
        diagnosis_text = generate_diagnosis(
            uploaded_url=req.image_url,
            healthy_url=best_healthy_url,
        )
    except Exception as e:
        print(f"[pipeline] Gemini error: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Failed to generate diagnosis: {str(e)}",
        )
    print(f"[pipeline] Diagnosis: {diagnosis_text[:200]}…")

    # Check if Gemini says the plant is healthy
    healthy_keywords = ["no significant difference", "appears healthy", "plant appears healthy"]
    if any(kw in diagnosis_text.lower() for kw in healthy_keywords):
        return DiagnoseResponse(
            is_verified_crop=True,
            similarity_score=round(similarity_score, 4),
            diagnosis=diagnosis_text,
            disease=None,
            message=f"The {req.crop_name} plant appears healthy. No disease symptoms detected.",
        )

    # ------------------------------------------------------------------
    # Step 4 — Convert diagnosis to vector embedding
    # ------------------------------------------------------------------
    print("[pipeline] Step 4: Converting diagnosis to embedding …")
    diagnosis_embedding = text_to_embedding(diagnosis_text)
    print(f"[pipeline] Embedding generated ({len(diagnosis_embedding)} dims)")

    # ------------------------------------------------------------------
    # Step 5 — Search DB for best matching disease
    # ------------------------------------------------------------------
    print("[pipeline] Step 5: Searching disease database …")
    try:
        match = find_matching_disease(crop, diagnosis_embedding)
    except Exception as e:
        print(f"[pipeline] DB error: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Database lookup failed: {str(e)}",
        )

    if match:
        print(f"[pipeline] Best match: {match['disease_name']} (confidence={match['confidence']})")
        disease = DiseaseMatch(
            disease_name=match["disease_name"],
            confidence=match["confidence"],
            symptoms=match["symptoms"],
        )
        message = (
            f"Disease detected: **{match['disease_name']}** "
            f"(confidence: {match['confidence']:.2%}). "
            f"Observed symptoms: {diagnosis_text[:300]}"
        )
    else:
        disease = None
        message = (
            f"Symptoms were observed but no matching disease was found in the database "
            f"for '{req.crop_name}'. The diagnosis is: {diagnosis_text[:300]}"
        )

    print(f"[pipeline] Done.\n{'='*60}\n")

    return DiagnoseResponse(
        is_verified_crop=True,
        similarity_score=round(similarity_score, 4),
        diagnosis=diagnosis_text,
        disease=disease,
        message=message,
    )


# ---------------------------------------------------------------------------
# Run with: uvicorn main:app --reload --port 8000
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
