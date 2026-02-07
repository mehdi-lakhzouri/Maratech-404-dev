"""
TILI RAG System - Configuration
All tunable parameters in one place.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from RAG folder
load_dotenv(Path(__file__).parent / ".env")

# ─── Paths ───
RAG_DIR = Path(__file__).parent
PROJECT_ROOT = RAG_DIR.parent
PDF_SOURCE_DIR = PROJECT_ROOT / "docs" / "pdf"
CHROMA_PERSIST_DIR = RAG_DIR / "chroma_db"

# ─── OpenAI / OpenRouter ───
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# ─── Embedding ───
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "huggingface")  # "huggingface" or "openai"
HUGGINGFACE_MODEL = "all-MiniLM-L6-v2"
OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"

# ─── Chunking ───
CHUNK_SIZE = 1500
CHUNK_OVERLAP = 300
SEPARATORS = ["\n\n", "\n", ". ", " ", ""]

# ─── Retrieval ───
RETRIEVAL_K = 3
SCORE_THRESHOLD = 0.8  # Similarity score above this → poor match → fallback

# ─── LLM (via OpenRouter / GPT-4o-mini) ───
LLM_MODEL = "openai/gpt-4o-mini"
LLM_TEMPERATURE = 0.1
LLM_MAX_TOKENS = 400

# ─── Collection ───
CHROMA_COLLECTION_NAME = "tili_documents"
