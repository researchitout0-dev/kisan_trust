"""
Embedding service — converts text (diagnosis descriptions) into
384-dimensional vector embeddings using all-MiniLM-L6-v2.

This is the SAME model used to embed disease symptoms in the DB,
so cosine similarity comparisons are meaningful.
"""

import numpy as np
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Lazy-loaded model
# ---------------------------------------------------------------------------
_model = None


def _load_model():
    global _model
    if _model is None:
        print("[embedding_service] Loading all-MiniLM-L6-v2 …")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("[embedding_service] Embedding model ready.")


def text_to_embedding(text: str) -> list[float]:
    """
    Convert a text string into a 384-dim embedding vector.

    Returns a plain Python list[float] for JSON serialisation and
    easy cosine comparison with DB-stored embeddings.
    """
    _load_model()
    embedding = _model.encode(text, normalize_embeddings=True)
    return embedding.tolist()
