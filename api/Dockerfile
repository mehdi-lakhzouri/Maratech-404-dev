# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  TILI RAG — Backend (FastAPI + RAG Pipeline)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FROM python:3.13-slim

# System dependencies for PyMuPDF, Pillow, and sentence-transformers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libmupdf-dev \
    libjpeg-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (cached layer)
COPY RAG/requirements.txt /app/RAG/requirements.txt

# OPTIMIZATION: Install CPU-only Torch first to avoid massive CUDA downloads (saves ~2GB)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir -r RAG/requirements.txt \
    && pip install --no-cache-dir \
       fastapi \
       "uvicorn[standard]" \
       sse-starlette \
       PyMuPDF \
       Pillow \
       requests \
       python-multipart

# Copy application code
COPY RAG/ /app/RAG/
COPY api/ /app/api/

# Copy PDF documents (pre-bundled for the hackathon)
COPY docs/ /app/docs/

# Create necessary directories
RUN mkdir -p /app/docs/pdf /app/docs/captions /app/RAG/chroma_db

# Pre-download the HuggingFace embedding model at build time
# so it doesn't download at first request
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Run ingestion at build time so the vector store is ready
# This requires the .env to NOT be needed for embeddings (huggingface is local)
RUN python -m RAG.ingest --reset || echo "Ingestion skipped (will run at startup if needed)"

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
