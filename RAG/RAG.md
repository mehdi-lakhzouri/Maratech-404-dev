# RAG System Implementation Guide

This document provides a complete technical breakdown of the RAG (Retrieval-Augmented Generation) system. It is designed to allow a developer or AI assistant to re-implement the exact same logic in a new project.

## 1. Architecture Overview

The system uses a standard RAG pipeline with **History-Aware Retrieval**.

1.  **Ingestion**: Documents (PDF, MD, DOCX, TXT) are loaded, cleaned, and split into chunks.
2.  **Indexing**: Chunks are embedded (using OpenAI or HuggingFace) and stored in ChromaDB.
3.  **Retrieval**: User queries are first "contextualized" using chat history, then used to query ChromaDB.
4.  **Generation**: Retrieved context + Chat History + Original Question are fed to GPT-4o-mini to generate an answer.

### Tech Stack

- **Framework**: LangChain (Community & Core)
- **Vector Store**: ChromaDB
- **LLM**: OpenAI (GPT-4o-mini)
- **Embeddings**: OpenAI (`text-embedding-3-small`) OR HuggingFace (`all-MiniLM-L6-v2`)
- **Document Parsers**: `pypdf`, `docx2txt`, `unstructured`

---

## 2. Project Structure

Organize the new project with this folder structure:

```text
new_project/
├── .env                    # API Keys
├── requirements.txt        # Dependencies
├── main.py                 # (Optional) CLI Entry point
└── RAG/
    ├── __init__.py
    ├── document_loader.py  # Loading & Splitting
    ├── vector_store.py     # ChromaDB Management
    └── rag_chain.py        # Logic & LCEL Chains
```

---

## 3. Dependencies

Create a `requirements.txt` with these core packages:

```text
langchain
langchain-openai
langchain-community
langchain-core
chromadb
pypdf
docx2txt
python-dotenv
tiktoken
sentence-transformers
duckduckgo-search  # Required for Web Search fallback
```

---

## 4. Implementation Details

### Module 1: Document Loading (`RAG/document_loader.py`)

**Purpose**: Loads multiple file formats and cleans text artifacts (specifically PDF spacing issues).

**Key Logic**:

- **PDF Cleaning**: Detects "s p a c e d t e x t" artifacts common in PDFs and fixes them using regex.
- **Splitter**: Uses `RecursiveCharacterTextSplitter` with `chunk_size=1000` and `overlap=200`.

**Code Structure**:

```python
from langchain_community.document_loaders import DirectoryLoader, TextLoader, PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import re
from pathlib import Path

def clean_text(text: str) -> str:
    # Heuristic to fix "A m o t i v a t e d" PDF artifacts
    # ... (See regex logic in original code)
    return text.strip()

def load_documents(directory_path, file_pattern):
    # Logic to route based on file extension (.pdf, .md, .docx)
    # Returns List[Document]

def split_documents(documents, chunk_size=1000, chunk_overlap=200):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    return splitter.split_documents(documents)
```

### Module 2: Vector Store (`RAG/vector_store.py`)

**Purpose**: Manages the Chroma database and embeddings.

**Key Logic**:

- **Dual Embeddings**: Toggle between `OpenAIEmbeddings` (high quality, paid) and `HuggingFaceEmbeddings` (local, free).
- **Persistence**: Saves DB to `./chroma_db` directory.

**Code Structure**:

```python
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

def create_vector_store(chunks, persist_dir="./chroma_db", use_free_embeddings=True):
    if use_free_embeddings:
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    else:
        embeddings = OpenAIEmbeddings()

    return Chroma.from_documents(documents=chunks, embedding=embeddings, persist_directory=persist_dir)

def load_vector_store(persist_dir="./chroma_db", ...):
    # Initializes Chroma with same embedding function used during creation
    return Chroma(persist_directory=persist_dir, embedding_function=embeddings)
```

### Module 3: RAG Logic (`RAG/rag_chain.py`)

**Purpose**: The core "Brain" with intelligent fallback. It connects the vector store, LLM, and Web Search.

**Key Logic - Intelligent Fallback**:
This is a sophisticated chain that doesn't just "retrieve and answer". It actively checks quality:

1.  **Score Check**: Retrieves docs with similarity scores. If the best match distance is > 0.8 (irrelevant), it flags for Web Search.
2.  **IDK Loop**: Monitors the LLM's streaming response for phrases like "I don't have enough information". If detected, it aborts the stream and switches to Web Search.
3.  **Contextual Retrieval**: (Standard) Uses Chat History to rewrite questions before searching.
4.  **Web Search**: Uses `DuckDuckGoSearchRun` to find live info when local docs fail.

**Code Structure**:

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableBranch
from langchain_core.output_parsers import StrOutputParser
from langchain_community.tools import DuckDuckGoSearchRun
import json

def create_rag_chain(vector_store):
    # Standard chain setup with ONE key addition:
    # Return 'vector_store' in the result dict so we can run raw score searches later
    return {
        "chain": rag_chain,
        "vector_store": vector_store,
        "retriever": retriever,
        "llm": llm,
        # ... other components
    }

async def stream_rag_answer(qa_chain, question, chat_history):
    # 1. Rewrite Question (Contextualize) - Same as standard logic

    # 2. Score-Based Check
    docs = vector_store.similarity_search_with_score(standalone_q, k=3)
    use_web = False
    if not docs or docs[0][1] > 0.8: # Threshold check (lower is better, > 0.8 is poor)
        use_web = True

    # 3. Web Search Fallback (Pre-emptive)
    if use_web:
        search = DuckDuckGoSearchRun()
        web_content = search.invoke(standalone_q)
        # Create pseudo-document from web content

    # 4. Stream & Monitor
    if not use_web:
        # Stream from Local Docs
        async for chunk in stream_from_llm():
            yield chunk
            # Check accumulated text for "I don't have enough information"
            if "i don't have enough information" in accumulated_text.lower():
                # ABORT and switch to Web Search
                use_web = True
                break

    # 5. Web Search Fallback (Reactive)
    if use_web:
         # Perform search and stream new answer using Web Context
         pass
```

### Module 4: Configuration & Usage (`rag_system.py`)

**Configuration Dictionary**:

```python
CONFIG = {
    "chunk_size": 1000,
    "chunk_overlap": 200,
    "retrieval_k": 4,
    "embedding_model": "all-MiniLM-L6-v2", # or "text-embedding-3-small"
    "use_free_embeddings": True
}
```

## 5. Environment Variables (.env)

```env
OPENAI_API_KEY=sk-...
# Optional:
OPENAI_BASE_URL=...
```

## 6. Replication Steps

To replicate this in a new project:

1.  **Copy the code**: Use the "Code Structure" sections above to recreate the python files.
2.  **Install dependencies**: Run `pip install -r requirements.txt`.
3.  **Set up .env**: Add your OpenAI API Key.
4.  **Prepare Docs**: Put your `.md` or `.pdf` files in a folder (e.g., `data/`).
5.  **Run Setup**: Create a script that calls `document_loader.load_and_split` then `vector_store.create_vector_store`.
6.  **Run Query**: Create a script that calls `vector_store.load_vector_store` then `rag_chain.create_rag_chain`.
