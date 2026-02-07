# 📷 Image Captioning — Description IA des images

## Vue d'ensemble

Le module Image Captioning permet aux **utilisateurs aveugles** de comprendre le contenu visuel (photos, graphiques, diagrammes, logos) des documents PDF. Il utilise **GPT-4o-mini Vision** via OpenRouter pour générer des descriptions détaillées en français et en anglais.

## Architecture

```
PDF → PyMuPDF (extraction images) → Filtrage (taille min)
                                          ↓
              Image → Base64 → GPT-4o-mini Vision → Description FR + EN
                                          ↓
                              Cache JSON (docs/captions/)
                                          ↓
                              API → Frontend → Affichage accessible
```

## Pipeline détaillé

### 1. Extraction d'images (`extract_images_from_pdf`)

- Utilise **PyMuPDF** (`fitz`) pour extraire les images de chaque page
- **Filtrage** : Ignore les images décoratives (icônes, puces)
  - Largeur minimum : 80px
  - Hauteur minimum : 80px
  - Taille minimum : 5 KB
- **Limite** : Maximum 20 images par document

### 2. Préparation de l'image

- **Thumbnail** : Redimensionné à 200px max (pour l'affichage frontend)
- **Image complète** : Redimensionné à 1024px max (pour l'API Vision)
- **Format** : Conversion en JPEG base64
- **Gestion des modes** : Conversion CMYK → RGB si nécessaire

### 3. Captioning via GPT-4o-mini Vision

**Prompt utilisé :**
> "Décris cette image de manière détaillée en français pour une personne aveugle.
> Si c'est un graphique, tableau, logo ou diagramme, décris son contenu et sa signification.
> Sois précis et utile.
> Format de réponse STRICT (2 lignes) :
> FR: <description en français>
> EN: <description in English>"

**Paramètres :** `max_tokens=300`, `temperature=0.2`

### 4. Cache

Les descriptions sont mises en cache dans `docs/captions/{nom_sans_extension}.json` pour éviter de re-générer à chaque accès.

## Structure des données

### `ImageCaption` (dataclass)

```python
@dataclass
class ImageCaption:
    page: int          # Numéro de page (1-indexé)
    image_index: int   # Index de l'image dans la page
    width: int         # Largeur originale
    height: int        # Hauteur originale
    caption_fr: str    # Description en français
    caption_en: str    # Description en anglais
    image_base64: str  # Thumbnail en base64 JPEG
```

## Fonctions exportées

| Fonction | Description |
|---|---|
| `caption_pdf_images(path, translate, use_cache)` | Pipeline complet : extraction + captioning |
| `get_cached_captions(filename)` | Récupérer les captions depuis le cache |
| `delete_cached_captions(filename)` | Supprimer le cache (appelé lors de la suppression d'un document) |

## Endpoint API

### `GET /documents/{filename}/images`

Retourne les descriptions de toutes les images d'un PDF.

**Response :**
```json
{
  "filename": "rapport.pdf",
  "image_count": 2,
  "images": [
    {
      "page": 3,
      "image_index": 0,
      "width": 800,
      "height": 600,
      "caption_fr": "Graphique en barres montrant l'évolution du budget trimestriel...",
      "caption_en": "Bar chart showing quarterly budget evolution...",
      "thumbnail": "<base64>"
    }
  ]
}
```

## Interface frontend

Sur la page Documents, chaque document a un bouton **📷 Images** :
- Clic → appel API → affichage des descriptions
- Thumbnail cliquable avec description textuelle
- Annonce aria-live quand les descriptions sont prêtes
- Son de feedback (`playSound("success")` ou `playSound("error")`)

## Dépendances

- **PyMuPDF** (`fitz`) — Extraction des images des PDFs
- **Pillow** (`PIL`) — Manipulation d'images (resize, conversion)
- **requests** — Appels à l'API OpenRouter Vision
- **GPT-4o-mini** via OpenRouter — Génération des descriptions

## Fichier source

- `RAG/image_captioner.py` (~322 lignes)

## Test CLI

```bash
python -m RAG.image_captioner docs/pdf/mon_document.pdf
```
