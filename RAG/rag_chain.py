"""
TILI RAG - RAG Chain (Core Brain) — Production Grade
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Features:
  • History-aware question reformulation
  • Score-based retrieval with cosine distance calibration
  • Multi-document context aggregation with source attribution
  • MMR (Maximum Marginal Relevance) for retrieval diversity
  • Token budget management to prevent context overflow
  • Structured response with metadata (sources, scores, confidence)
  • Graceful fallback with IDK detection
  • Streaming response support
  • Per-document summarization with page-ordered chunks
"""

import logging
import time
from typing import List, Dict, Any, Generator, Optional
from dataclasses import dataclass, field

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from langchain_chroma import Chroma

from . import config

logger = logging.getLogger(__name__)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  DATA STRUCTURES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@dataclass
class RetrievedChunk:
    """A single retrieved chunk with metadata."""
    content: str
    filename: str
    doc_type: str
    page: int
    score: float  # L2 distance (lower = better)

    @property
    def confidence(self) -> str:
        """Human-readable confidence level."""
        if self.score < 0.8:
            return "haute"
        elif self.score < 1.2:
            return "moyenne"
        else:
            return "faible"


@dataclass
class RAGResponse:
    """Structured response from the RAG system."""
    answer: str
    sources: List[RetrievedChunk] = field(default_factory=list)
    standalone_question: str = ""
    latency_ms: int = 0
    fallback_used: bool = False
    confidence: str = "haute"

    def format_sources(self) -> str:
        """Format sources for display."""
        if not self.sources:
            return ""
        seen = set()
        lines = ["\n\n📎 **Sources:**"]
        for s in self.sources:
            key = f"{s.filename}:p{s.page}"
            if key not in seen:
                seen.add(key)
                lines.append(f"  • {s.filename} (p.{s.page}) — pertinence: {s.confidence}")
        return "\n".join(lines)

    def __str__(self) -> str:
        return self.answer + self.format_sources()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  PROMPTS — Token-Efficient, French-Optimized
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTEXTUALIZE_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "Tu es un expert en reformulation de contexte. "
     "Tâche : Reformule la dernière question pour qu'elle soit autonome, en incluant le contexte de l'historique si nécessaire. "
     "⚠️ IMPORTANT : Conserve STRICTEMENT la langue et le dialecte de la question originale (ex: si c'est en Derja, reformule en Derja). "
     "Ne réponds PAS à la question."),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

QA_SYSTEM = """Tu es "Tounsi-Bot", l'assistant expert et sympa de TILI. 

 INSTRUCTION SUPRÊME :
Même si le contexte est en Français, tu DOIS répondre dans la langue de l'utilisateur.

1. DETECTION DE LANGUE :
   Si la question contient des mots comme "chnouwa", "kifch", "wa9tech", "win", "mta3":
   >>> C'EST DU TOUNSI (DERJA).
   >>> TA RÉPONSE DOIT ÊTRE 100% EN DERJA (Alphabet latin/chat).
   >>> Commence ta réponse par "" pour montrer que tu as compris.
   >>> TRADUIS les infos du contexte (Français) vers le Derja.

   Si la question est en Français :
   >>> Réponds en Français standard.

2. LE CONTEXTE (SOURCE DE VÉRITÉ) :
   Base-toi UNIQUEMENT sur les infos ci-dessous.
   Cite tes sources à la fin.

[CONTEXTE]:
{context}"""

QA_PROMPT = ChatPromptTemplate.from_messages([
    ("system", QA_SYSTEM),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

SUMMARY_SYSTEM = """Résume ce document en français. Structure: titre, points clés (•), décisions, actions. Sois concis.

DOCUMENT:
{context}"""

SUMMARY_PROMPT = ChatPromptTemplate.from_messages([
    ("system", SUMMARY_SYSTEM),
    ("human", "Fais un résumé complet et structuré de ce document."),
])


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  LLM INITIALIZATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_llm(streaming: bool = False) -> ChatOpenAI:
    """Initialize LLM via OpenRouter with optional streaming."""
    kwargs = {
        "model": config.LLM_MODEL,
        "temperature": config.LLM_TEMPERATURE,
        "max_tokens": config.LLM_MAX_TOKENS,
        "openai_api_key": config.OPENAI_API_KEY,
        "streaming": streaming,
    }
    if config.OPENAI_BASE_URL:
        kwargs["openai_api_base"] = config.OPENAI_BASE_URL

    return ChatOpenAI(**kwargs)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CONTEXT FORMATTING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MAX_CONTEXT_CHARS = 12000  # ~3000 tokens — allow more context for detailed answers


def format_docs_with_budget(docs: List[Document], max_chars: int = MAX_CONTEXT_CHARS) -> str:
    """
    Format retrieved documents with a token budget.
    Prioritizes higher-relevance docs (earlier in list).
    Deduplicates near-identical chunks.
    """
    seen_content = set()
    formatted = []
    char_count = 0

    for i, doc in enumerate(docs, 1):
        content = doc.page_content.strip()

        # Dedup: skip if >80% overlap with already-seen content
        content_sig = content[:200]
        if content_sig in seen_content:
            continue
        seen_content.add(content_sig)

        source = doc.metadata.get("filename", "inconnu")
        page = doc.metadata.get("page", "?")
        doc_type = doc.metadata.get("doc_type", "")

        block = (
            f"[Doc {i} | {source} p.{page} | {doc_type}]\n"
            f"{content}"
        )

        # Token budget check
        if char_count + len(block) > max_chars and formatted:
            logger.info(f"Token budget reached at doc {i}/{len(docs)} ({char_count} chars)")
            break

        formatted.append(block)
        char_count += len(block)

    return "\n\n---\n\n".join(formatted)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  RETRIEVAL ENGINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Calibrated thresholds for ChromaDB L2 distance with all-MiniLM-L6-v2
SCORE_HIGH_CONFIDENCE = 1.0    # < 1.0 = very relevant
SCORE_MEDIUM_CONFIDENCE = 1.4  # 1.0-1.4 = somewhat relevant
SCORE_LOW_CONFIDENCE = 1.8     # > 1.8 = probably irrelevant


def retrieve_with_scores(
    vector_store: Chroma,
    query: str,
    k: int = None,
    use_mmr: bool = True,
) -> List[RetrievedChunk]:
    """
    Retrieve documents with score-based quality assessment.
    Uses MMR for diversity by default.
    """
    k = k or config.RETRIEVAL_K

    if use_mmr:
        # MMR: balances relevance + diversity (avoids redundant chunks)
        docs = vector_store.max_marginal_relevance_search(
            query, k=k, fetch_k=k * 3, lambda_mult=0.7
        )
        # Get scores separately for the MMR results
        scored = vector_store.similarity_search_with_score(query, k=k * 3)
        score_map = {}
        for doc, score in scored:
            key = doc.page_content[:100]
            score_map[key] = score

        chunks = []
        for doc in docs:
            key = doc.page_content[:100]
            score = score_map.get(key, 2.0)
            chunks.append(RetrievedChunk(
                content=doc.page_content,
                filename=doc.metadata.get("filename", "inconnu"),
                doc_type=doc.metadata.get("doc_type", ""),
                page=doc.metadata.get("page", 0),
                score=score,
            ))
    else:
        scored = vector_store.similarity_search_with_score(query, k=k)
        chunks = [
            RetrievedChunk(
                content=doc.page_content,
                filename=doc.metadata.get("filename", "inconnu"),
                doc_type=doc.metadata.get("doc_type", ""),
                page=doc.metadata.get("page", 0),
                score=score,
            )
            for doc, score in scored
        ]

    # Sort by score (lower = better)
    chunks.sort(key=lambda c: c.score)

    # Log retrieval quality
    if chunks:
        best = chunks[0].score
        worst = chunks[-1].score
        sources = set(c.filename for c in chunks)
        logger.info(
            f"Retrieved {len(chunks)} chunks | scores: {best:.3f}–{worst:.3f} | "
            f"sources: {len(sources)} docs | MMR: {use_mmr}"
        )

    return chunks


def assess_retrieval_quality(chunks: List[RetrievedChunk]) -> str:
    """Assess overall retrieval quality from chunk scores."""
    if not chunks:
        return "none"

    best_score = chunks[0].score
    if best_score < SCORE_HIGH_CONFIDENCE:
        return "haute"
    elif best_score < SCORE_MEDIUM_CONFIDENCE:
        return "moyenne"
    elif best_score < SCORE_LOW_CONFIDENCE:
        return "faible"
    else:
        return "none"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  RAG CHAIN — CORE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def create_rag_chain(vector_store: Chroma) -> Dict[str, Any]:
    """
    Build the full RAG chain components.
    Returns a dict with all components for flexible usage.
    """
    llm = get_llm(streaming=False)
    llm_stream = get_llm(streaming=True)

    # Contextualize chain (rewrites question using history)
    contextualize_chain = CONTEXTUALIZE_PROMPT | llm | StrOutputParser()

    return {
        "llm": llm,
        "llm_stream": llm_stream,
        "vector_store": vector_store,
        "contextualize_chain": contextualize_chain,
    }


def _build_history(chat_history: List[Dict]) -> list:
    """Convert chat history dicts to LangChain message objects."""
    messages = []
    for msg in chat_history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            messages.append(AIMessage(content=msg["content"]))
    return messages


# ─── IDK Detection ───
IDK_INDICATORS = [
    "je ne sais pas",
    "pas d'information",
    "n'apparaît pas",
    "pas dans le contexte",
    "pas dans les documents",
    "impossible de répondre",
    "aucune information",
    "pas mentionné",
    # Derja IDK indicators
    "ma l9itech",
    "ma 3andich",
    "mawjouda",
    "ma naaref",
]


# ─── Derja Detection ───
DERJA_MARKERS = [
    "chnouwa", "kifch", "kif", "win", "wa9tech", "3lach", "chkoun",
    "mta3", "hedha", "hédha", "barcha", "flouss", "7keya", "5ouya",
    "ya5i", "bech", "elli", "fama", "mawjoud", "nafs", "3and",
]

def _is_derja(text: str) -> bool:
    """Detect if user input is in Tunisian Derja."""
    text_lower = text.lower()
    matches = sum(1 for m in DERJA_MARKERS if m in text_lower)
    return matches >= 1
    """Detect if the LLM response is an 'I don't know' answer."""
    answer_lower = answer.lower()
    return any(indicator in answer_lower for indicator in IDK_INDICATORS)


# ─── Multi-Query Fallback ───
MULTI_QUERY_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "Tu reçois une question sur les documents de TILI. "
     "Génère exactement 3 reformulations différentes de cette question, "
     "en variant les mots-clés et la perspective. "
     "Retourne UNIQUEMENT les 3 reformulations, une par ligne, sans numérotation."),
    ("human", "{question}"),
])


def _multi_query_retrieve(
    chain_components: Dict,
    original_question: str,
    original_chunks: List[RetrievedChunk],
    vector_store: Chroma,
) -> List[RetrievedChunk]:
    """
    Multi-query fallback: generate alternate queries, retrieve for each,
    merge and deduplicate chunks with the original results.
    """
    llm = chain_components["llm"]

    try:
        alt_chain = MULTI_QUERY_PROMPT | llm | StrOutputParser()
        alt_text = alt_chain.invoke({"question": original_question})
        alt_queries = [q.strip() for q in alt_text.strip().split("\n") if q.strip()][:3]
        logger.info(f"Multi-query fallback: {len(alt_queries)} alternate queries generated")
    except Exception as e:
        logger.warning(f"Multi-query generation failed: {e}")
        return original_chunks

    # Collect all chunks, keyed by content prefix to dedup
    seen = {}
    for c in original_chunks:
        key = c.content[:150]
        if key not in seen or c.score < seen[key].score:
            seen[key] = c

    for alt_q in alt_queries:
        try:
            alt_chunks = retrieve_with_scores(vector_store, alt_q, k=config.RETRIEVAL_K, use_mmr=True)
            for c in alt_chunks:
                key = c.content[:150]
                if key not in seen or c.score < seen[key].score:
                    seen[key] = c
        except Exception as e:
            logger.warning(f"Alt query retrieval failed: {e}")

    merged = sorted(seen.values(), key=lambda c: c.score)
    # Keep top N chunks (double the original k to give more context)
    max_chunks = config.RETRIEVAL_K * 2
    merged = merged[:max_chunks]
    logger.info(f"Multi-query merged: {len(merged)} unique chunks (from {len(original_chunks)} original)")
    return merged


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ASK — Main Q&A (Synchronous)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def ask(
    chain_components: Dict,
    question: str,
    chat_history: List[Dict] = None,
    use_mmr: bool = True,
) -> str:
    """
    Ask a question — returns formatted answer string.
    Backward-compatible with existing query.py.
    """
    response = ask_with_metadata(chain_components, question, chat_history, use_mmr)
    return str(response)


def ask_with_metadata(
    chain_components: Dict,
    question: str,
    chat_history: List[Dict] = None,
    use_mmr: bool = True,
) -> RAGResponse:
    """
    Ask a question — returns structured RAGResponse with full metadata.
    
    Pipeline:
    1. Contextualize question (if history exists)
    2. Retrieve with MMR + score assessment
    3. Quality gate — reject if no relevant docs
    4. Generate answer with token-budgeted context
    5. IDK detection
    6. Return structured response
    """
    start = time.time()

    if chat_history is None:
        chat_history = []

    llm = chain_components["llm"]
    vector_store = chain_components["vector_store"]
    history_messages = _build_history(chat_history)

    # ── Step 1: Contextualize ──
    if chat_history:
        try:
            standalone_q = chain_components["contextualize_chain"].invoke({
                "chat_history": history_messages,
                "input": question,
            })
            logger.info(f"Contextualized: '{question}' → '{standalone_q}'")
        except Exception as e:
            logger.warning(f"Contextualization failed: {e}. Using original question.")
            standalone_q = question
    else:
        standalone_q = question

    # ── Step 2: Retrieve ──
    chunks = retrieve_with_scores(vector_store, standalone_q, use_mmr=use_mmr)

    if not chunks:
        empty_msg = ("🇹🇳 Ma l9aw 7ata document fil base mta3 TILI."
                     if _is_derja(question)
                     else "Aucun document trouvé dans la base de connaissances TILI.")
        return RAGResponse(
            answer=empty_msg,
            standalone_question=standalone_q,
            latency_ms=int((time.time() - start) * 1000),
            confidence="none",
        )

    # ── Step 2b: Multi-Query Fallback ──
    quality = assess_retrieval_quality(chunks)
    if quality in ("moyenne", "faible"):
        logger.info(f"Quality '{quality}' — triggering multi-query fallback")
        chunks = _multi_query_retrieve(chain_components, standalone_q, chunks, vector_store)
        quality = assess_retrieval_quality(chunks)  # Re-assess after merge

    # ── Step 3: Quality Gate ──

    if quality == "none":
        if _is_derja(question):
            no_info_msg = (
                "🇹🇳 Ma l9itech 7ata ma3louma fil documents mta3 TILI bech njawbek.\n\n"
                "💡 **Nasiha:**\n"
                "• Jarreb ta3mel question akther précise\n"
                "• T7a99e9 eli sou2alek 3la les comptes-rendus, rapports, conventions walla finances mta3 TILI"
            )
        else:
            no_info_msg = (
                "Je n'ai pas trouvé d'information pertinente dans les documents TILI "
                "pour répondre à cette question.\n\n"
                "💡 **Suggestions:**\n"
                "• Reformulez votre question avec des termes plus spécifiques\n"
                "• Vérifiez que la question porte sur les comptes-rendus, rapports, "
                "conventions ou finances de TILI"
            )
        return RAGResponse(
            answer=no_info_msg,
            sources=chunks[:2],
            standalone_question=standalone_q,
            latency_ms=int((time.time() - start) * 1000),
            confidence="none",
            fallback_used=True,
        )

    # ── Step 4: Build Context & Generate ──
    # Convert chunks back to Documents for formatting
    docs = [
        Document(
            page_content=c.content,
            metadata={"filename": c.filename, "doc_type": c.doc_type, "page": c.page}
        )
        for c in chunks
    ]
    context = format_docs_with_budget(docs)

    qa_chain = QA_PROMPT | llm | StrOutputParser()
    answer = qa_chain.invoke({
        "context": context,
        "chat_history": history_messages,
        "input": question,
    })

    # ── Step 5: IDK Detection ──
    fallback_used = _is_idk_response(answer)
    if fallback_used:
        logger.info("IDK response detected.")

    latency = int((time.time() - start) * 1000)

    return RAGResponse(
        answer=answer,
        sources=chunks,
        standalone_question=standalone_q,
        latency_ms=latency,
        confidence=quality,
        fallback_used=fallback_used,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ASK — Streaming
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def ask_stream(
    chain_components: Dict,
    question: str,
    chat_history: List[Dict] = None,
) -> Generator[str, None, None]:
    """
    Stream answer token by token. Yields string chunks.
    Use for real-time display in CLI or web UI.
    """
    if chat_history is None:
        chat_history = []

    llm_stream = chain_components["llm_stream"]
    vector_store = chain_components["vector_store"]
    history_messages = _build_history(chat_history)

    # Contextualize
    standalone_q = question
    if chat_history:
        try:
            standalone_q = chain_components["contextualize_chain"].invoke({
                "chat_history": history_messages,
                "input": question,
            })
        except Exception:
            pass

    # Retrieve
    chunks = retrieve_with_scores(vector_store, standalone_q, use_mmr=True)
    if not chunks:
        yield "Aucun document pertinent trouvé."
        return

    quality = assess_retrieval_quality(chunks)
    if quality == "none":
        yield "Je n'ai pas trouvé d'information pertinente dans les documents TILI."
        return

    # Build context
    docs = [
        Document(
            page_content=c.content,
            metadata={"filename": c.filename, "doc_type": c.doc_type, "page": c.page}
        )
        for c in chunks
    ]
    context = format_docs_with_budget(docs)

    # Stream response
    qa_chain = QA_PROMPT | llm_stream | StrOutputParser()
    for token in qa_chain.stream({
        "context": context,
        "chat_history": history_messages,
        "input": question,
    }):
        yield token

    # Append sources
    seen = set()
    source_lines = ["\n\n📎 **Sources:**"]
    for c in chunks:
        key = f"{c.filename}:p{c.page}"
        if key not in seen:
            seen.add(key)
            source_lines.append(f"  • {c.filename} (p.{c.page}) — pertinence: {c.confidence}")
    yield "\n".join(source_lines)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SUMMARIZATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def summarize_document(chain_components: Dict, filename: str) -> str:
    """
    Generate a structured summary of a specific document.
    Retrieves all chunks ordered by page number for coherent summarization.
    """
    vector_store = chain_components["vector_store"]
    llm = chain_components["llm"]

    # Get ALL chunks from this document via metadata filter
    collection = vector_store._collection
    results = collection.get(
        where={"filename": filename},
        include=["documents", "metadatas"],
    )

    if not results["documents"]:
        return f"❌ Aucun contenu trouvé pour: {filename}"

    # Rebuild as Documents sorted by page
    docs = []
    for content, meta in zip(results["documents"], results["metadatas"]):
        docs.append(Document(page_content=content, metadata=meta))

    docs.sort(key=lambda d: d.metadata.get("page", 0))

    logger.info(f"Summarizing '{filename}': {len(docs)} chunks (page-ordered)")

    context = format_docs_with_budget(docs, max_chars=2000)  # Minimal for low credits

    summary_chain = SUMMARY_PROMPT | llm | StrOutputParser()
    summary = summary_chain.invoke({"context": context})

    return summary


def summarize_all(chain_components: Dict) -> Dict[str, str]:
    """Generate summaries for ALL documents. Returns {filename: summary}."""
    vector_store = chain_components["vector_store"]

    collection = vector_store._collection
    all_meta = collection.get()["metadatas"]
    filenames = sorted(set(m.get("filename", "") for m in all_meta if m.get("filename")))

    logger.info(f"Batch summarization: {len(filenames)} documents")

    summaries = {}
    for i, fn in enumerate(filenames, 1):
        logger.info(f"[{i}/{len(filenames)}] {fn}")
        try:
            summaries[fn] = summarize_document(chain_components, fn)
        except Exception as e:
            logger.error(f"  Failed: {fn} — {e}")
            summaries[fn] = f"❌ Erreur: {e}"

    return summaries
