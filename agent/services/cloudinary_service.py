"""
Cloudinary service — fetches healthy reference images for a given crop.

Uses a dedicated Cloudinary account where healthy crop images are stored
in folders named after each crop (e.g.  cotton/, wheat/, rice/).
"""

import cloudinary
import cloudinary.api
from config import settings


def _configure():
    """Configure the Cloudinary SDK with the healthy-images account."""
    cloudinary.config(
        cloud_name=settings.HEALTHY_CLOUD_NAME,
        api_key=settings.HEALTHY_API_KEY,
        api_secret=settings.HEALTHY_API_SECRET,
        secure=True,
    )


def get_healthy_image_urls(crop_name: str, max_images: int = 5) -> list[str]:
    """
    Return up to `max_images` public URLs of healthy crop images
    from the Cloudinary folder named `crop_name`.
    """
    _configure()

    # Folder path on Cloudinary — images sit in asset_folder e.g. "cotton"
    folder = crop_name.lower().strip()

    try:
        # Try asset_folder search first (new Cloudinary DAM mode)
        result = cloudinary.api.resources_by_asset_folder(
            folder,
            max_results=max_images,
            resource_type="image",
        )
        urls = [r["secure_url"] for r in result.get("resources", [])]
        if urls:
            return urls

        # Fallback to prefix-based search (legacy mode)
        result = cloudinary.api.resources(
            type="upload",
            prefix=f"{folder}/",
            max_results=max_images,
            resource_type="image",
        )
        urls = [r["secure_url"] for r in result.get("resources", [])]
        return urls
    except cloudinary.exceptions.NotFound:
        return []
    except Exception as e:
        print(f"[cloudinary_service] Error fetching images for '{crop_name}': {e}")
        return []
