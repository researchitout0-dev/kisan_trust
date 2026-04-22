import requests as req
from google import genai
from google.genai import types
from config import settings

def verify_crop(uploaded_url: str, healthy_urls: list[str], threshold: float = 0.75):
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    img_bytes = req.get(uploaded_url, timeout=15).content
    
    prompt = f"""Is this image a {settings.SUPPORTED_CROPS} crop plant? 
    Reply with only a JSON object like: {{"is_crop": true, "crop_type": "wheat", "confidence": 0.92}}"""
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
            types.Part.from_text(text=prompt),
        ]
    )
    
    import json, re
    text = response.text.strip()
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        result = json.loads(match.group())
        confidence = result.get("confidence", 0.0)
        return result.get("is_crop", False), confidence, healthy_urls[0] if healthy_urls else None
    
    return False, 0.0, None
