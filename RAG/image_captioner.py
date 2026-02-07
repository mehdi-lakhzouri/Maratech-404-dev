"""TILI RAG — Image Captioner (GPT-4o-mini Vision via OpenRouter)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Extracts images from PDF documents using PyMuPDF, then generates
descriptive captions using GPT-4o-mini vision capabilities.

Accessibility feature: allows visually impaired users to understand
charts, photos, diagrams, and other visual content in PDFs.

Pipeline:
  PDF → PyMuPDF (extract images) → filter (min size) → GPT-4o-mini vision (caption) → JSON
"""

import io
import json
import logging
import base64
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

# ─── Configuration ───
MIN_IMAGE_WIDTH = 80   # Ignore tiny images (icons, bullets, decorations)
MIN_IMAGE_HEIGHT = 80
MIN_IMAGE_BYTES = 5000  # Ignore very small images (< 5KB)
MAX_IMAGES_PER_DOC = 20  # Safety limit

# Where to cache image captions (JSON per document)
CAPTIONS_DIR = Path(__file__).parent.parent / "docs" / "captions"


@dataclass
class ImageCaption:
    """A single image extracted from a PDF with its AI-generated caption."""
    page: int
    image_index: int
    width: int
    height: int
    caption_fr: str
    caption_en: str
    image_base64: str  # Base64-encoded thumbnail for display


def extract_images_from_pdf(pdf_path: str | Path) -> List[Dict]:
    """
    Extract images from a PDF using PyMuPDF.
    Returns list of dicts with page, image bytes, dimensions.
    Filters out tiny decorative images.
    """
    import fitz  # PyMuPDF

    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    doc = fitz.open(str(pdf_path))
    images = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images(full=True)

        for img_index, img_info in enumerate(image_list):
            xref = img_info[0]
            try:
                base_image = doc.extract_image(xref)
                if not base_image:
                    continue

                image_bytes = base_image["image"]
                width = base_image["width"]
                height = base_image["height"]

                # Filter: skip tiny images (icons, bullets, decorations)
                if width < MIN_IMAGE_WIDTH or height < MIN_IMAGE_HEIGHT:
                    continue
                if len(image_bytes) < MIN_IMAGE_BYTES:
                    continue

                images.append({
                    "page": page_num + 1,  # 1-indexed
                    "image_index": img_index,
                    "width": width,
                    "height": height,
                    "image_bytes": image_bytes,
                    "ext": base_image.get("ext", "png"),
                })

                if len(images) >= MAX_IMAGES_PER_DOC:
                    logger.warning(f"Reached max images limit ({MAX_IMAGES_PER_DOC}) for {pdf_path.name}")
                    break

            except Exception as e:
                logger.warning(f"Failed to extract image {img_index} from page {page_num + 1}: {e}")
                continue

    doc.close()
    logger.info(f"Extracted {len(images)} images from '{pdf_path.name}'")
    return images


def _create_thumbnail(image_bytes: bytes, max_size: int = 200) -> str:
    """Create a small thumbnail and return as base64 for frontend display."""
    from PIL import Image

    img = Image.open(io.BytesIO(image_bytes))

    # Convert to RGB if needed (some PDFs have CMYK)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")

    # Resize to thumbnail
    img.thumbnail((max_size, max_size))

    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=75)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _image_to_base64(image_bytes: bytes) -> str:
    """Convert image bytes to base64 JPEG for the vision API."""
    from PIL import Image

    img = Image.open(io.BytesIO(image_bytes))
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")

    # Resize large images to save tokens (max 1024px side)
    max_side = 1024
    if max(img.size) > max_side:
        img.thumbnail((max_side, max_side))

    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def caption_image_vision(image_b64: str) -> Dict[str, str]:
    """
    Generate image captions using GPT-4o-mini vision via OpenRouter.
    Returns both French and English captions directly — no separate translation needed.
    """
    import requests
    from . import config

    try:
        resp = requests.post(
            f"{config.OPENAI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {config.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": config.LLM_MODEL,
                "messages": [{
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Décris cette image de manière détaillée en français pour une personne aveugle. "
                                "Si c'est un graphique, tableau, logo ou diagramme, décris son contenu et sa signification. "
                                "Sois précis et utile. "
                                "Format de réponse STRICT (2 lignes):\n"
                                "FR: <description en français>\n"
                                "EN: <description in English>"
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                        },
                    ],
                }],
                "max_tokens": 300,
                "temperature": 0.2,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

        content = data["choices"][0]["message"]["content"].strip()

        # Parse FR/EN lines
        caption_fr = content
        caption_en = content
        for line in content.split("\n"):
            line = line.strip()
            if line.upper().startswith("FR:"):
                caption_fr = line[3:].strip()
            elif line.upper().startswith("EN:"):
                caption_en = line[3:].strip()

        return {"caption_fr": caption_fr, "caption_en": caption_en}

    except Exception as e:
        logger.error(f"Vision captioning failed: {e}")
        return {"caption_fr": "Image (description non disponible)", "caption_en": "Image (description unavailable)"}


def caption_pdf_images(
    pdf_path: str | Path,
    translate: bool = True,
    use_cache: bool = True,
) -> List[ImageCaption]:
    """
    Full pipeline: extract images from PDF → caption each with GPT-4o-mini vision.

    Args:
        pdf_path: Path to the PDF file
        translate: Ignored (kept for API compat) — vision model returns both languages
        use_cache: Whether to use/save cached captions

    Returns:
        List of ImageCaption objects with captions + thumbnails
    """
    pdf_path = Path(pdf_path)
    filename = pdf_path.name

    # ── Check cache ──
    CAPTIONS_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = CAPTIONS_DIR / f"{pdf_path.stem}.json"

    if use_cache and cache_path.exists():
        try:
            cached = json.loads(cache_path.read_text(encoding="utf-8"))
            logger.info(f"📷 Loaded {len(cached)} cached captions for '{filename}'")
            return [ImageCaption(**c) for c in cached]
        except Exception:
            pass  # Cache corrupted, regenerate

    # ── Extract images ──
    images = extract_images_from_pdf(pdf_path)

    if not images:
        logger.info(f"📷 No images found in '{filename}'")
        return []

    logger.info(f"📷 Captioning {len(images)} images from '{filename}'...")

    captions: List[ImageCaption] = []

    for img_data in images:
        # Create thumbnail + full base64 for vision API
        thumbnail_b64 = _create_thumbnail(img_data["image_bytes"])
        full_b64 = _image_to_base64(img_data["image_bytes"])

        # Generate captions via GPT-4o-mini vision (returns FR + EN directly)
        result = caption_image_vision(full_b64)
        caption_fr = result["caption_fr"]
        caption_en = result["caption_en"]

        captions.append(ImageCaption(
            page=img_data["page"],
            image_index=img_data["image_index"],
            width=img_data["width"],
            height=img_data["height"],
            caption_en=caption_en,
            caption_fr=caption_fr,
            image_base64=thumbnail_b64,
        ))

        logger.info(
            f"  📷 Page {img_data['page']}: [{img_data['width']}x{img_data['height']}] "
            f"→ \"{caption_fr}\""
        )

    # ── Save to cache ──
    try:
        cache_data = [asdict(c) for c in captions]
        cache_path.write_text(json.dumps(cache_data, ensure_ascii=False, indent=2), encoding="utf-8")
        logger.info(f"📷 Cached {len(captions)} captions for '{filename}'")
    except Exception as e:
        logger.warning(f"Failed to cache captions: {e}")

    return captions


def get_cached_captions(filename: str) -> Optional[List[ImageCaption]]:
    """Get cached captions for a document (if available)."""
    cache_path = CAPTIONS_DIR / f"{Path(filename).stem}.json"
    if cache_path.exists():
        try:
            cached = json.loads(cache_path.read_text(encoding="utf-8"))
            return [ImageCaption(**c) for c in cached]
        except Exception:
            return None
    return None


def delete_cached_captions(filename: str) -> bool:
    """Delete cached captions for a document."""
    cache_path = CAPTIONS_DIR / f"{Path(filename).stem}.json"
    if cache_path.exists():
        cache_path.unlink()
        return True
    return False


# ─── CLI Test ───
if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    if len(sys.argv) < 2:
        print("Usage: python -m RAG.image_captioner <path_to_pdf>")
        sys.exit(1)

    pdf_file = sys.argv[1]
    results = caption_pdf_images(pdf_file)

    print(f"\n{'='*60}")
    print(f"Found {len(results)} images with captions")
    print(f"{'='*60}")

    for cap in results:
        print(f"\n📷 Page {cap.page} [{cap.width}x{cap.height}]")
        print(f"   EN: {cap.caption_en}")
        print(f"   FR: {cap.caption_fr}")
