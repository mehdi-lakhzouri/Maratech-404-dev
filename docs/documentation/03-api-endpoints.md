# 🌐 API FastAPI — Endpoints

## Vue d'ensemble

Le backend TILI est une API REST construite avec **FastAPI**, servie par **Uvicorn** sur le port `8000`. Elle expose les endpoints pour le Q&A, le résumé, la gestion de documents, et l'accessibilité.

## Démarrage

```bash
make api
# ou directement :
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

Documentation Swagger automatique : `http://localhost:8000/docs`

## Endpoints

### 💬 Q&A (Questions-Réponses)

#### `POST /ask`
Poser une question au système RAG.

**Request :**
```json
{
  "question": "Quel est le budget de TILI ?",
  "chat_history": [
    {"role": "user", "content": "Bonjour"},
    {"role": "assistant", "content": "Bonjour ! Comment puis-je vous aider ?"}
  ]
}
```

**Response :**
```json
{
  "answer": "Selon le rapport financier...",
  "sources": [
    {
      "filename": "Rapport_Financier_Q1_2026.pdf",
      "page": 3,
      "doc_type": "Rapport Financier",
      "score": 0.654,
      "confidence": "haute"
    }
  ],
  "latency_ms": 1523,
  "confidence": "haute",
  "fallback_used": false
}
```

#### `GET /ask/stream?question=...`
Streaming SSE (Server-Sent Events) pour réponses en temps réel.

**Events :**
- `token` — Un token de la réponse
- `done` — Fin de la réponse
- `error` — Erreur

### 📝 Résumé

#### `POST /summarize`
Résumer un document spécifique.

**Request :** `{"filename": "CR_001_Reunion.pdf"}`

**Response :** `{"filename": "...", "summary": "## Résumé\n..."}`

#### `GET /summarize/all`
Résumer tous les documents indexés.

**Response :** `{"summaries": [{"filename": "...", "summary": "..."}]}`

### 📄 Documents

#### `GET /documents`
Lister tous les documents indexés avec métadonnées.

**Response :**
```json
[
  {
    "filename": "CR_001_Reunion_Projet_Alpha.pdf",
    "doc_type": "Compte-Rendu",
    "chunk_count": 5
  }
]
```

#### `POST /upload`
Uploader un PDF : sauvegarde, classification automatique, ingestion dans le vector store.

**Request :** `multipart/form-data` avec champ `file` (PDF uniquement)

**Response :**
```json
{
  "filename": "nouveau_doc.pdf",
  "doc_type": "Convention",
  "pages": 12,
  "chunks": 8,
  "message": "Document 'nouveau_doc.pdf' uploadé et classifié comme 'Convention'"
}
```

#### `DELETE /documents/{filename}`
Supprimer un document du vector store, du disque, et du cache de captions.

**Response :** `{"filename": "...", "chunks_deleted": 5, "message": "..."}`

### 📷 Images

#### `GET /documents/{filename}/images`
Obtenir les descriptions IA des images contenues dans un PDF.

**Response :**
```json
{
  "filename": "rapport.pdf",
  "image_count": 3,
  "images": [
    {
      "page": 2,
      "image_index": 0,
      "width": 800,
      "height": 600,
      "caption_fr": "Graphique montrant l'évolution du budget...",
      "caption_en": "Chart showing budget evolution...",
      "thumbnail": "<base64 JPEG>"
    }
  ]
}
```

### ❤️ Santé

#### `GET /health`
Vérification de l'état du système.

**Response :**
```json
{
  "status": "ok",
  "vector_count": 142,
  "document_count": 8,
  "model": "openai/gpt-4o-mini",
  "embedding": "huggingface/all-MiniLM-L6-v2",
  "uptime_seconds": 3600
}
```

## Middleware CORS

Origines autorisées :
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

## Fichier source

- `api/main.py` — Contient tous les endpoints, la gestion du cycle de vie (lifespan), et les modèles Pydantic

## Startup (Lifespan)

Au démarrage, l'API :
1. Charge le vector store ChromaDB
2. Crée la chain RAG (LLM + contextualization + retrieval)
3. Log le nombre de vecteurs chargés

Si le chargement échoue, l'API ne démarre pas.
