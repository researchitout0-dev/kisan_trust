import requests as req
import json
import re
from google import genai
from google.genai import types
from config import settings

def verify_crop(uploaded_url: str, healthy_urls: list[str], threshold: float = 0.75):
    client = genai.Client(api_key=settings.GEMINI_API_KEY)  # ← make sure this line exists
    
    img_bytes = req.get(uploaded_url, timeout=15).content
    
    crop_list = ", ".join(settings.SUPPORTED_CROPS)
    prompt = f"""Look at this image. Is this a crop plant? If yes, which crop is it?
Supported crops: {crop_list}
Reply with ONLY a JSON object, no extra text:
{{"is_crop": true, "crop_type": "wheat", "confidence": 0.92}}"""
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
            types.Part.from_text(text=prompt),
        ]
    )
    
    text = response.text.strip()
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        result = json.loads(match.group())
        confidence = float(result.get("confidence", 0.0))
        is_crop = result.get("is_crop", False)
        return is_crop and confidence >= threshold, confidence, healthy_urls[0] if healthy_urls else None
    
    return False, 0.0, None
