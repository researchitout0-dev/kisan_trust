"""
Centralized configuration — loads .env and exposes all settings.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Cloudinary (healthy reference images)
    HEALTHY_CLOUD_NAME: str = os.getenv("HEALTHY_CLOUD_NAME", "")
    HEALTHY_API_KEY: str = os.getenv("HEALTHY_API_KEY", "")
    HEALTHY_API_SECRET: str = os.getenv("HEALTHY_API_SECRET", "")

    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # MySQL
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = os.getenv("DB_NAME", "crop_diseases")

    # Server
    PORT: int = int(os.getenv("PORT", "8000"))

    # Crop verification
    CLIP_SIMILARITY_THRESHOLD: float = 0.75

    # Supported crops (folder names on Cloudinary)
    SUPPORTED_CROPS: list[str] = [
        "cotton", "wheat", "rice", "maize", "barley",
        "indian_mustard", "watermelon", "mango", "banana",
        "tomato", "citrus", "guava", "papaya", "grapes",
        "pineapple", "pomegranate", "sapota", "apple",
        "pear", "peach", "plum", "jackfruit", "coconut",
        "cashew", "amla", "strawberry", "litchi", "jujube",
        "date_palm", "fig",
    ]


settings = Settings()

