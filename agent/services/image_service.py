"""
Image service — CLIP-based feature extraction and crop verification.

Uses OpenAI's CLIP (clip-vit-base-patch32) to convert images into
feature vectors, then compares them via cosine similarity to verify
that the uploaded image is actually the claimed crop.
"""

import io
import numpy as np
import requests
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

# ---------------------------------------------------------------------------
# Lazy-loaded globals (heavy models load once, reused across requests)
# ---------------------------------------------------------------------------
_clip_model = None
_clip_processor = None


def _load_clip():
    """Load CLIP model + processor once."""
    global _clip_model, _clip_processor
    if _clip_model is None:
        print("[image_service] Loading CLIP model …")
        _clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        print("[image_service] CLIP model ready.")


def _download_image(url: str) -> Image.Image:
    """Download an image from a URL and return a PIL Image."""
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    return Image.open(io.BytesIO(resp.content)).convert("RGB")


def get_image_embedding(image_url: str) -> np.ndarray:
    """
    Download an image and return its CLIP feature vector (512-dim).
    """
    _load_clip()
    image = _download_image(image_url)
    inputs = _clip_processor(images=image, return_tensors="pt")
    outputs = _clip_model.get_image_features(**inputs)
    # Normalise to unit vector for cosine similarity
    embedding = outputs.detach().numpy().flatten()
    embedding = embedding / np.linalg.norm(embedding)
    return embedding


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two vectors (assumed already normalised)."""
    return float(np.dot(a, b))


def verify_crop(
    uploaded_url: str,
    healthy_urls: list[str],
    threshold: float = 0.75,
) -> tuple[bool, float, str]:
    """
    Compare the uploaded image against healthy reference images.

    Returns:
        (is_match, avg_similarity, best_healthy_url)
    """
    if not healthy_urls:
        return False, 0.0, ""

    uploaded_emb = get_image_embedding(uploaded_url)

    similarities = []
    for url in healthy_urls:
        try:
            ref_emb = get_image_embedding(url)
            sim = cosine_similarity(uploaded_emb, ref_emb)
            similarities.append((sim, url))
        except Exception as e:
            print(f"[image_service] Skipping {url}: {e}")

    if not similarities:
        return False, 0.0, ""

    avg_sim = float(np.mean([s for s, _ in similarities]))
    best_url = max(similarities, key=lambda x: x[0])[1]

    return avg_sim >= threshold, avg_sim, best_url
