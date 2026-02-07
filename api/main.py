"""
TILI RAG — FastAPI Backend
━━━━━━━━━━━━━━━━━━━━━━━━━━
Endpoints:
  POST /ask              → Q&A with metadata
  GET  /ask/stream       → SSE streaming Q&A
  POST /summarize        → Summarize one document
  GET  /summarize/all    → Summarize all documents
  POST /upload           → Upload & auto-classify a PDF
  GET  /documents        → List indexed documents
  GET  /documents/{f}/images    → AI image captions
  GET  /health           → System health check
"""

import sys
import time
import json
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

# Ensure project root is on path so RAG package is importable
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from RAG.vector_store import load_vector_store
from RAG.rag_chain import (
    create_rag_chain,
    ask_with_metadata,
    ask_stream,
    summarize_document,
    summarize_all,
)
from RAG.document_loader import detect_doc_type, clean_pdf_text, load_pdfs, split_documents
from RAG.image_captioner import (
    caption_pdf_images,
    get_cached_captions,
    delete_cached_captions,
    ImageCaption,
)
from RAG import config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ─── Global state ───
_state = {
    "chain": None,
    "vector_store": None,
    "start_time": None,
}


# ─── Lifespan: pre-load at startup ───
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Loading vector store & RAG chain...")
    _state["start_time"] = time.time()
    try:
        vs = load_vector_store()
        _state["vector_store"] = vs
        _state["chain"] = create_rag_chain(vs)
        count = vs._collection.count()
        logger.info(f"✅ Ready — {count} vectors loaded")
    except Exception as e:
        logger.error(f"❌ Failed to load RAG system: {e}")
        raise

    yield
    logger.info("👋 Shutting down")


app = FastAPI(
    title="TILI RAG API",
    description="API documentaire IA pour TILI — Tunisia Inclusive Labor Institute",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REQUEST / RESPONSE MODELS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class AskRequest(BaseModel):
    question: str
    chat_history: Optional[List[ChatMessage]] = None


class SourceItem(BaseModel):
    filename: str
    page: int
    doc_type: str
    score: float
    confidence: str


class AskResponse(BaseModel):
    answer: str
    sources: List[SourceItem]
    latency_ms: int
    confidence: str
    fallback_used: bool


class SummarizeRequest(BaseModel):
    filename: str


class DocumentInfo(BaseModel):
    filename: str
    doc_type: str
    chunk_count: int


class HealthResponse(BaseModel):
    status: str
    vector_count: int
    document_count: int
    model: str
    embedding: str
    uptime_seconds: int


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/ask", response_model=AskResponse)
def post_ask(req: AskRequest):
    """Ask a question to the RAG system."""
    chain = _state["chain"]
    if not chain:
        raise HTTPException(503, "RAG system not loaded")

    history = [{"role": m.role, "content": m.content} for m in (req.chat_history or [])]

    try:
        resp = ask_with_metadata(chain, req.question, history)
    except Exception as e:
        logger.error(f"Ask failed: {e}")
        raise HTTPException(500, f"Erreur RAG: {e}")

    sources = []
    seen = set()
    for s in resp.sources:
        key = f"{s.filename}:{s.page}"
        if key not in seen:
            seen.add(key)
            sources.append(SourceItem(
                filename=s.filename,
                page=s.page,
                doc_type=s.doc_type,
                score=round(s.score, 3),
                confidence=s.confidence,
            ))

    return AskResponse(
        answer=resp.answer,
        sources=sources,
        latency_ms=resp.latency_ms,
        confidence=resp.confidence,
        fallback_used=resp.fallback_used,
    )


@app.get("/ask/stream")
async def get_ask_stream(question: str):
    """Stream answer tokens via SSE."""
    chain = _state["chain"]
    if not chain:
        raise HTTPException(503, "RAG system not loaded")

    def event_generator():
        try:
            for token in ask_stream(chain, question):
                yield {"event": "token", "data": token}
            yield {"event": "done", "data": "[DONE]"}
        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(event_generator())


@app.post("/summarize")
def post_summarize(req: SummarizeRequest):
    """Summarize a specific document."""
    chain = _state["chain"]
    if not chain:
        raise HTTPException(503, "RAG system not loaded")

    try:
        summary = summarize_document(chain, req.filename)
    except Exception as e:
        logger.error(f"Summarize failed: {e}")
        raise HTTPException(500, f"Erreur: {e}")

    return {"filename": req.filename, "summary": summary}


@app.get("/summarize/all")
def get_summarize_all():
    """Summarize all documents."""
    chain = _state["chain"]
    if not chain:
        raise HTTPException(503, "RAG system not loaded")

    try:
        summaries = summarize_all(chain)
    except Exception as e:
        logger.error(f"Summarize all failed: {e}")
        raise HTTPException(500, f"Erreur: {e}")

    return {"summaries": summaries}


@app.get("/documents", response_model=List[DocumentInfo])
def get_documents():
    """List all indexed documents with metadata."""
    vs = _state["vector_store"]
    if not vs:
        raise HTTPException(503, "RAG system not loaded")

    collection = vs._collection
    all_meta = collection.get()["metadatas"]

    # Aggregate per filename
    doc_map = {}
    for meta in all_meta:
        fn = meta.get("filename", "unknown")
        if fn not in doc_map:
            doc_map[fn] = {"doc_type": meta.get("doc_type", ""), "count": 0}
        doc_map[fn]["count"] += 1

    return [
        DocumentInfo(filename=fn, doc_type=info["doc_type"], chunk_count=info["count"])
        for fn, info in sorted(doc_map.items())
    ]


@app.post("/upload")
async def post_upload(file: UploadFile = File(...)):
    """Upload a PDF document: auto-classify, save, ingest into vector store."""
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Seuls les fichiers PDF sont acceptés.")

    vs = _state["vector_store"]
    if not vs:
        raise HTTPException(503, "RAG system not loaded")

    filename = file.filename
    pdf_dir = config.PDF_SOURCE_DIR
    pdf_dir.mkdir(parents=True, exist_ok=True)
    dest_path = pdf_dir / filename

    # Check for duplicate
    if dest_path.exists():
        raise HTTPException(
            409,
            f"Le fichier '{filename}' existe déjà. Renommez-le avant de l'uploader."
        )

    try:
        # 1. Save PDF to docs/pdf/
        content = await file.read()
        dest_path.write_bytes(content)
        logger.info(f"📥 Uploaded: {filename} ({len(content)} bytes)")

        # 2. Load & detect type
        from langchain_community.document_loaders import PyPDFLoader
        loader = PyPDFLoader(str(dest_path))
        pages = loader.load()

        combined_text = "\n".join(p.page_content for p in pages[:3])
        doc_type = detect_doc_type(filename, combined_text)

        # 3. Clean & enrich metadata
        for page in pages:
            page.page_content = clean_pdf_text(page.page_content)
            page.metadata["filename"] = filename
            page.metadata["doc_type"] = doc_type
            page.metadata["doc_title"] = filename.replace(".pdf", "").replace("_", " ")

        # 4. Split into chunks
        chunks = split_documents(pages)

        # 5. Add to existing vector store
        vs.add_documents(chunks)
        logger.info(f"✅ Ingested: {filename} → {len(chunks)} chunks (type: {doc_type})")

        # 6. Reload vector store & rebuild chain so queries see new data immediately
        fresh_vs = load_vector_store()
        _state["vector_store"] = fresh_vs
        _state["chain"] = create_rag_chain(fresh_vs)
        new_count = fresh_vs._collection.count()
        logger.info(f"🔄 Vector store refreshed: {new_count} total vectors")

        return {
            "filename": filename,
            "doc_type": doc_type,
            "pages": len(pages),
            "chunks": len(chunks),
            "message": f"Document '{filename}' uploadé et classifié comme '{doc_type}'"
        }

    except Exception as e:
        # Clean up on failure
        if dest_path.exists():
            dest_path.unlink()
        logger.error(f"❌ Upload failed for {filename}: {e}")
        raise HTTPException(500, f"Erreur lors du traitement: {e}")


@app.get("/documents/{filename}/images")
def get_document_images(filename: str):
    """
    Get AI-generated image descriptions for a PDF document.
    Uses BLIP model to caption images — accessibility feature for blind users.
    Uses cached captions if available, otherwise generates them.
    """
    pdf_path = config.PDF_SOURCE_DIR / filename
    if not pdf_path.exists():
        raise HTTPException(404, f"Document '{filename}' non trouvé")

    try:
        captions = caption_pdf_images(pdf_path, translate=True, use_cache=True)
        return {
            "filename": filename,
            "image_count": len(captions),
            "images": [
                {
                    "page": c.page,
                    "image_index": c.image_index,
                    "width": c.width,
                    "height": c.height,
                    "caption_fr": c.caption_fr,
                    "caption_en": c.caption_en,
                    "thumbnail": c.image_base64,  # base64 JPEG
                }
                for c in captions
            ],
        }
    except Exception as e:
        logger.error(f"Image captioning failed for {filename}: {e}")
        raise HTTPException(500, f"Erreur lors de l'analyse des images: {e}")


@app.delete("/documents/{filename}")
def delete_document(filename: str):
    """Delete a document from the vector store and disk."""
    vs = _state["vector_store"]
    if not vs:
        raise HTTPException(503, "RAG system not loaded")

    # Remove from vector store
    collection = vs._collection
    all_data = collection.get(where={"filename": filename}, include=[])
    ids_to_delete = all_data["ids"]

    if not ids_to_delete:
        raise HTTPException(404, f"Document '{filename}' non trouvé dans la base vectorielle")

    collection.delete(ids=ids_to_delete)
    logger.info(f"🗑️ Deleted {len(ids_to_delete)} chunks for '{filename}'")

    # Remove PDF file from disk
    pdf_path = config.PDF_SOURCE_DIR / filename
    if pdf_path.exists():
        pdf_path.unlink()
        logger.info(f"🗑️ Deleted file: {pdf_path}")

    # Remove cached image captions
    delete_cached_captions(filename)

    # Reload vector store & rebuild chain so queries reflect deletion
    fresh_vs = load_vector_store()
    _state["vector_store"] = fresh_vs
    _state["chain"] = create_rag_chain(fresh_vs)
    new_count = fresh_vs._collection.count()
    logger.info(f"🔄 Vector store refreshed after delete: {new_count} total vectors")

    return {
        "filename": filename,
        "chunks_deleted": len(ids_to_delete),
        "message": f"Document '{filename}' supprimé"
    }



@app.get("/health", response_model=HealthResponse)
def get_health():
    """System health check."""
    vs = _state["vector_store"]
    if not vs:
        raise HTTPException(503, "RAG system not loaded")

    collection = vs._collection
    all_meta = collection.get()["metadatas"]
    filenames = set(m.get("filename", "") for m in all_meta)
    uptime = int(time.time() - _state["start_time"]) if _state["start_time"] else 0

    return HealthResponse(
        status="ok",
        vector_count=collection.count(),
        document_count=len(filenames),
        model=config.LLM_MODEL,
        embedding=f"{config.EMBEDDING_PROVIDER}/{config.HUGGINGFACE_MODEL}",
        uptime_seconds=uptime,
    )


# ─── Run directly ───
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
