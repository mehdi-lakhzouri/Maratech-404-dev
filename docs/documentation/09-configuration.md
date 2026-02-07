# ⚙️ Configuration & Environnement

## Vue d'ensemble

Toute la configuration du système TILI est centralisée dans `RAG/config.py` et le fichier `.env`. Cela permet de modifier les paramètres sans toucher au code.

## Fichier `.env` (`RAG/.env`)

```env
# Clé API OpenRouter (ou OpenAI)
OPENAI_API_KEY=sk-or-v1-votre-cle-ici

# URL de base (OpenRouter par défaut)
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Fournisseur d'embeddings : "huggingface" (gratuit) ou "openai" (payant)
EMBEDDING_PROVIDER=huggingface
```

> ⚠️ **Important** : Le fichier `.env` contient des clés secrètes. Ne jamais le committer sur Git.

## Configuration Python (`RAG/config.py`)

### Chemins

| Variable | Valeur | Description |
|---|---|---|
| `RAG_DIR` | `RAG/` | Dossier du module RAG |
| `PROJECT_ROOT` | Racine du projet | Dossier parent de RAG/ |
| `PDF_SOURCE_DIR` | `docs/pdf/` | Dossier source des PDFs |
| `CHROMA_PERSIST_DIR` | `RAG/chroma_db/` | Stockage persistant ChromaDB |

### LLM (via OpenRouter)

| Variable | Valeur par défaut | Description |
|---|---|---|
| `LLM_MODEL` | `openai/gpt-4o-mini` | Modèle utilisé pour les réponses |
| `LLM_TEMPERATURE` | `0.1` | Contrôle la créativité (0 = déterministe) |
| `LLM_MAX_TOKENS` | `400` | Nombre max de tokens par réponse |
| `OPENAI_API_KEY` | depuis `.env` | Clé API OpenRouter |
| `OPENAI_BASE_URL` | depuis `.env` | URL de l'API (OpenRouter) |

### Embeddings

| Variable | Valeur par défaut | Description |
|---|---|---|
| `EMBEDDING_PROVIDER` | `huggingface` | `huggingface` (gratuit, local) ou `openai` (payant) |
| `HUGGINGFACE_MODEL` | `all-MiniLM-L6-v2` | Modèle d'embeddings HuggingFace |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Modèle d'embeddings OpenAI (si choisi) |

### Chunking

| Variable | Valeur | Description |
|---|---|---|
| `CHUNK_SIZE` | `1500` | Taille max d'un chunk en caractères |
| `CHUNK_OVERLAP` | `300` | Chevauchement entre chunks consécutifs |
| `SEPARATORS` | `["\n\n", "\n", ". ", " ", ""]` | Séparateurs pour le découpage progressif |

### Retrieval

| Variable | Valeur | Description |
|---|---|---|
| `RETRIEVAL_K` | `3` | Nombre de chunks récupérés par requête |
| `SCORE_THRESHOLD` | `0.8` | Seuil de distance (au-dessus = faible pertinence) |

### Collection ChromaDB

| Variable | Valeur | Description |
|---|---|---|
| `CHROMA_COLLECTION_NAME` | `tili_documents` | Nom de la collection dans ChromaDB |

## Variables frontend (`web/`)

L'URL de l'API backend est configurable via variable d'environnement Vite :

```env
# web/.env (optionnel)
VITE_API_URL=http://localhost:8000
```

Si non définie, le fallback est `http://localhost:8000` (défini dans `web/src/api.js`).

## Structure des dossiers de données

```
docs/
├── pdf/          # PDFs source (uploadés ou ajoutés manuellement)
├── captions/     # Cache des descriptions d'images (JSON)
├── *.md          # Fichiers Markdown source (avant conversion PDF)
│
RAG/
├── chroma_db/    # Base vectorielle ChromaDB (persistée)
├── .env          # Variables d'environnement
└── config.py     # Configuration centralisée
```

## Makefile

| Commande | Description |
|---|---|
| `make install` | Installer toutes les dépendances (Python + Node.js) |
| `make ingest` | Lancer le pipeline d'ingestion des PDFs |
| `make api` | Démarrer le serveur FastAPI (port 8000) |
| `make web` | Démarrer le serveur React (port 3000/5173) |
| `make dev` | Démarrer API + Web en parallèle |
| `make test-query` | Test rapide de l'API (/health + /ask) |
| `make clean` | Nettoyer les fichiers générés (ChromaDB, node_modules, __pycache__) |

## Dépendances

### Python (`RAG/requirements.txt`)

```
langchain>=0.3.0
langchain-openai>=0.2.0
langchain-community>=0.3.0
langchain-core>=0.3.0
langchain-huggingface>=0.1.0
chromadb>=0.5.0
pypdf>=4.0.0
python-dotenv>=1.0.0
tiktoken>=0.7.0
sentence-transformers>=3.0.0
duckduckgo-search>=6.0.0
```

**Dépendances supplémentaires (API) :**
```
fastapi
uvicorn[standard]
sse-starlette
PyMuPDF
Pillow
requests
```

### Node.js (`web/package.json`)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "react-markdown": "^9.0.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "vite": "^6.0.5"
  }
}
```
