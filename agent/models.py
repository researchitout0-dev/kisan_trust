"""
Pydantic request / response models for the /diagnose endpoint.
"""

from pydantic import BaseModel, HttpUrl
from typing import Optional


class DiagnoseRequest(BaseModel):
    image_url: str          # Cloudinary URL of the uploaded crop image
    crop_name: str          # e.g. "wheat", "rice", "tomato"


class DiseaseMatch(BaseModel):
    disease_name: str
    confidence: float       # cosine similarity score (0-1)
    symptoms: Optional[str] = None


class DiagnoseResponse(BaseModel):
    is_verified_crop: bool          # did CLIP confirm it's the claimed crop?
    similarity_score: float         # avg CLIP cosine similarity
    diagnosis: str                  # morphological analysis from Gemini
    disease: Optional[DiseaseMatch] = None   # best matching disease
    message: str                    # human-readable summary
