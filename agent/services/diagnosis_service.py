"""
Diagnosis service — uses Gemini 2.0 Flash to describe morphological
differences between the uploaded (potentially diseased) crop image
and a healthy reference image.

Focus: colour changes, spots, lesions, wilting, deformation,
discolouration, necrosis, and any other observable symptoms.
"""

from google import genai
from google.genai import types
from config import settings

# ---------------------------------------------------------------------------
# Configure Gemini client once
# ---------------------------------------------------------------------------
# Force re-creation on reload
_client = None


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
        key_preview = settings.GEMINI_API_KEY[:10] + "..." if settings.GEMINI_API_KEY else "MISSING"
        print(f"[diagnosis_service] Gemini client ready (key: {key_preview})")
    return _client


DIAGNOSIS_PROMPT = """You are an expert agricultural plant pathologist.

I am showing you two images of a crop plant:
- **Image 1** (uploaded): This is the image to be diagnosed.
- **Image 2** (reference): This is a known healthy specimen of the same crop.

Compare Image 1 against Image 2 and describe **every observable morphological difference** that could indicate disease or stress. Be specific and detailed. Focus on:

1. **Colour changes** — yellowing, browning, chlorosis, anthocyanin accumulation, bleaching
2. **Spots & lesions** — shape, size, colour, distribution, concentric rings, halos
3. **Deformation** — curling, crinkling, stunting, galls, swelling
4. **Wilting & necrosis** — drooping, drying, tissue death patterns
5. **Surface changes** — powdery/downy coatings, rust pustules, ooze, sticky residue
6. **Fruit/flower abnormalities** — if visible, note rot, discolouration, premature drop

Output a concise but thorough paragraph describing the symptoms you observe.
If the plant appears healthy (no significant differences), state that explicitly.
Do NOT guess a disease name — only describe what you see."""

SINGLE_IMAGE_PROMPT = """You are an expert agricultural plant pathologist.

Analyze this crop image and describe **every observable symptom** that could indicate disease or stress. Be specific and detailed. Focus on:

1. **Colour changes** — yellowing, browning, chlorosis, anthocyanin accumulation, bleaching
2. **Spots & lesions** — shape, size, colour, distribution, concentric rings, halos
3. **Deformation** — curling, crinkling, stunting, galls, swelling
4. **Wilting & necrosis** — drooping, drying, tissue death patterns
5. **Surface changes** — powdery/downy coatings, rust pustules, ooze, sticky residue
6. **Fruit/flower abnormalities** — if visible, note rot, discolouration, premature drop

Output a concise but thorough paragraph describing the symptoms you observe.
If the plant appears healthy, state that explicitly.
Do NOT guess a disease name — only describe what you see."""


def generate_diagnosis(uploaded_url: str, healthy_url: str = None) -> str:
    """
    Send image(s) to Gemini and get a morphological diagnosis.

    Args:
        uploaded_url:  URL of the farmer's uploaded crop image
        healthy_url:   URL of a healthy reference image (optional)

    Returns:
        A text description of all morphological differences observed.
    """
    import requests as req

    client = _get_client()

    # Download uploaded image
    img1_bytes = req.get(uploaded_url, timeout=15).content

    if healthy_url:
        # Two-image comparison mode
        img2_bytes = req.get(healthy_url, timeout=15).content
        contents = [
            types.Part.from_text(text=DIAGNOSIS_PROMPT),
            types.Part.from_bytes(data=img1_bytes, mime_type="image/jpeg"),
            types.Part.from_text(text="The above is Image 1 (uploaded crop, possibly diseased)."),
            types.Part.from_bytes(data=img2_bytes, mime_type="image/jpeg"),
            types.Part.from_text(text="The above is Image 2 (healthy reference of the same crop)."),
            types.Part.from_text(
                text="Now describe the morphological differences you observe in Image 1 compared to Image 2."
            ),
        ]
    else:
        # Single-image mode (no reference available)
        contents = [
            types.Part.from_text(text=SINGLE_IMAGE_PROMPT),
            types.Part.from_bytes(data=img1_bytes, mime_type="image/jpeg"),
            types.Part.from_text(text="Describe the symptoms you observe in this crop image."),
        ]

    import time

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
            )
            return response.text.strip()
        except Exception as e:
            if "503" in str(e) and attempt < max_retries - 1:
                wait = 2 ** (attempt + 1)
                print(f"[diagnosis_service] Gemini 503, retrying in {wait}s (attempt {attempt+1}/{max_retries})...")
                time.sleep(wait)
            else:
                raise
