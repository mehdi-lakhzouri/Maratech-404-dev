"""
TILI RAG - Vector Store Manager
Creates, loads, and queries ChromaDB with document embeddings.
"""

import logging
from pathlib import Path
from typing import List, Optional

from langchain_core.documents import Document
from langchain_chroma import Chroma

from . import config

logger = logging.getLogger(__name__)


def get_embeddings():
    """
    Get embedding function based on config.
    - 'huggingface': Free, local (all-MiniLM-L6-v2)
    - 'openai': Paid, high quality (text-embedding-3-small)
    """
    provider = config.EMBEDDING_PROVIDER.lower()

    if provider == "huggingface":
        from langchain_huggingface import HuggingFaceEmbeddings
        logger.info(f"Using HuggingFace embeddings: {config.HUGGINGFACE_MODEL}")
        return HuggingFaceEmbeddings(model_name=config.HUGGINGFACE_MODEL)

    elif provider == "openai":
        from langchain_openai import OpenAIEmbeddings
        logger.info(f"Using OpenAI embeddings: {config.OPENAI_EMBEDDING_MODEL}")
        kwargs = {"model": config.OPENAI_EMBEDDING_MODEL}
        if config.OPENAI_BASE_URL:
            kwargs["openai_api_base"] = config.OPENAI_BASE_URL
        return OpenAIEmbeddings(**kwargs)

    else:
        raise ValueError(f"Unknown embedding provider: {provider}. Use 'huggingface' or 'openai'.")


def create_vector_store(chunks: List[Document], persist_dir: Path = None) -> Chroma:
    """
    Create a new ChromaDB vector store from document chunks.
    Embeds all chunks and persists to disk.
    """
    if persist_dir is None:
        persist_dir = config.CHROMA_PERSIST_DIR

    persist_dir = Path(persist_dir)
    persist_dir.mkdir(parents=True, exist_ok=True)

    embeddings = get_embeddings()

    logger.info(f"Creating vector store with {len(chunks)} chunks...")
    logger.info(f"Persist directory: {persist_dir}")

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(persist_dir),
        collection_name=config.CHROMA_COLLECTION_NAME,
    )

    logger.info(f"Vector store created successfully! ({len(chunks)} vectors stored)")
    return vector_store


def load_vector_store(persist_dir: Path = None) -> Chroma:
    """
    Load an existing ChromaDB vector store from disk.
    """
    if persist_dir is None:
        persist_dir = config.CHROMA_PERSIST_DIR

    persist_dir = Path(persist_dir)
    if not persist_dir.exists():
        raise FileNotFoundError(
            f"Vector store not found at '{persist_dir}'. "
            f"Run ingestion first to create it."
        )

    embeddings = get_embeddings()

    logger.info(f"Loading vector store from: {persist_dir}")
    vector_store = Chroma(
        persist_directory=str(persist_dir),
        embedding_function=embeddings,
        collection_name=config.CHROMA_COLLECTION_NAME,
    )

    count = vector_store._collection.count()
    logger.info(f"Vector store loaded: {count} vectors")
    return vector_store


def delete_vector_store(persist_dir: Path = None):
    """Delete the persisted vector store (for re-ingestion)."""
    import shutil

    if persist_dir is None:
        persist_dir = config.CHROMA_PERSIST_DIR

    persist_dir = Path(persist_dir)
    if persist_dir.exists():
        shutil.rmtree(persist_dir)
        logger.info(f"Deleted vector store at: {persist_dir}")
    else:
        logger.info("No vector store to delete.")


# ─── CLI Test ───
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")

    # Quick test: load existing store and show stats
    try:
        vs = load_vector_store()
        count = vs._collection.count()
        print(f"\nVector store has {count} vectors.")

        # Test query
        results = vs.similarity_search_with_score("réunion stratégique", k=3)
        print(f"\nTop 3 results for 'réunion stratégique':")
        for doc, score in results:
            print(f"  [{score:.3f}] {doc.metadata.get('filename', '?')} - {doc.page_content[:100]}...")

    except FileNotFoundError as e:
        print(f"No vector store found. Run ingestion first.\n{e}")
