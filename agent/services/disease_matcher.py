"""
Disease matcher — searches the MySQL database for the
crop's known diseases and finds the best match via cosine similarity
between the diagnosis embedding and dynamically computed symptom embeddings.
"""

import json
import numpy as np
import mysql.connector
from config import settings
from services.embedding_service import text_to_embedding


def _get_connection():
    """Create a fresh MySQL connection."""
    return mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine similarity between two vectors."""
    a = np.array(a, dtype=np.float32)
    b = np.array(b, dtype=np.float32)
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    if norm == 0:
        return 0.0
    return float(dot / norm)


def find_matching_disease(
    crop_name: str,
    diagnosis_embedding: list[float],
) -> dict | None:
    """
    Query all diseases for `crop_name`, compare their symptom embeddings
    against the diagnosis embedding, and return the best match.

    Returns:
        {
            "disease_name": str,
            "confidence": float,   # cosine similarity
            "symptoms": str,       # raw symptom text from DB
        }
        or None if no diseases found / no reasonable match.
    """
    conn = _get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Join crops -> diseases -> disease_symptoms
        # Crops table uses 'common_name', disease_symptoms uses 'symptom_text'
        query = """
            SELECT d.disease_name, ds.symptom_text AS symptoms
            FROM disease_symptoms ds
            JOIN diseases d ON ds.disease_id = d.disease_id
            JOIN crops c ON d.crop_id = c.crop_id
            WHERE LOWER(c.common_name) = LOWER(%s)
               OR LOWER(c.common_name) LIKE CONCAT('%%', LOWER(%s), '%%')
        """
        cursor.execute(query, (crop_name.strip(), crop_name.strip()))
        rows = cursor.fetchall()

        if not rows:
            print(f"[disease_matcher] No diseases found for crop '{crop_name}'")
            return None

        best_match = None
        best_score = -1.0

        for row in rows:
            # Generate the embedding on the fly from the raw symptom string
            raw_symptoms = row["symptoms"]
            stored_embedding = text_to_embedding(raw_symptoms)

            score = _cosine_similarity(diagnosis_embedding, stored_embedding)

            if score > best_score:
                best_score = score
                best_match = {
                    "disease_name": row["disease_name"],
                    "confidence": round(score, 4),
                    "symptoms": raw_symptoms,
                }

        return best_match

    finally:
        cursor.close()
        conn.close()
