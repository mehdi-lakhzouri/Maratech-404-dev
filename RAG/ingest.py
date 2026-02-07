"""
TILI RAG - Ingestion Script
Run this to load PDFs, create embeddings, and build the vector store.

Usage:
    python -m RAG.ingest
    python -m RAG.ingest --reset   (delete existing DB and re-create)
"""

import sys
import time
import logging
import argparse

from .document_loader import load_and_split
from .vector_store import create_vector_store, delete_vector_store, load_vector_store
from . import config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="TILI RAG - Document Ingestion")
    parser.add_argument("--reset", action="store_true", help="Delete existing vector store before creating")
    args = parser.parse_args()

    print()
    print("=" * 55)
    print("  TILI RAG - Document Ingestion Pipeline")
    print("=" * 55)
    print(f"  PDF Source:  {config.PDF_SOURCE_DIR}")
    print(f"  Vector DB:   {config.CHROMA_PERSIST_DIR}")
    print(f"  Embeddings:  {config.EMBEDDING_PROVIDER}")
    print(f"  Chunk Size:  {config.CHUNK_SIZE} / Overlap: {config.CHUNK_OVERLAP}")
    print("=" * 55)
    print()

    # Step 0: Reset if requested
    if args.reset:
        logger.info("Resetting vector store...")
        delete_vector_store()
        print()

    # Step 1: Load and split PDFs
    start = time.time()
    logger.info("STEP 1: Loading and splitting PDF documents...")
    chunks = load_and_split()
    load_time = time.time() - start
    print()

    # Step 2: Create vector store
    start = time.time()
    logger.info("STEP 2: Creating vector store (embedding chunks)...")
    vector_store = create_vector_store(chunks)
    embed_time = time.time() - start
    print()

    # Step 3: Verify
    logger.info("STEP 3: Verifying vector store...")
    count = vector_store._collection.count()

    # Quick test query
    test_results = vector_store.similarity_search_with_score("réunion projet", k=2)

    print()
    print("=" * 55)
    print("  INGESTION COMPLETE")
    print("=" * 55)
    print(f"  Documents loaded:    {len(chunks)} chunks")
    print(f"  Vectors stored:      {count}")
    print(f"  Load time:           {load_time:.1f}s")
    print(f"  Embedding time:      {embed_time:.1f}s")
    print(f"  Total time:          {load_time + embed_time:.1f}s")

    if test_results:
        doc, score = test_results[0]
        print(f"\n  Test query: 'réunion projet'")
        print(f"  Best match: {doc.metadata.get('filename', '?')} (score: {score:.3f})")

    print("=" * 55)
    print()


if __name__ == "__main__":
    main()
