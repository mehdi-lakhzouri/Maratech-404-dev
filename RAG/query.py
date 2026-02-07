"""
TILI RAG - Query CLI (Production Grade)
Interactive command-line interface with streaming, metadata, and rich display.

Usage:
    python -m RAG.query
    python -m RAG.query --question "Quel est le budget du projet Alpha?"
    python -m RAG.query --question "..." --stream
    python -m RAG.query --summarize "Rapport_Financier_Q1_2026.pdf"
    python -m RAG.query --summarize-all
"""

import sys
import time
import logging
import argparse

from .vector_store import load_vector_store
from .rag_chain import (
    create_rag_chain, ask, ask_with_metadata, ask_stream,
    summarize_document, summarize_all, RAGResponse,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)


# ─── Display helpers ───

def display_response(response: RAGResponse, verbose: bool = False):
    """Rich display of a structured RAG response."""
    print(f"\n🤖 {response.answer}")
    print(response.format_sources())

    if verbose:
        print(f"\n  ⏱ {response.latency_ms}ms | "
              f"Confiance: {response.confidence} | "
              f"Fallback: {'oui' if response.fallback_used else 'non'}")
        if response.standalone_question != "":
            print(f"  🔄 Question reformulée: {response.standalone_question}")


def display_stream(token_gen):
    """Display streaming tokens in real-time."""
    print("\n🤖 ", end="", flush=True)
    for token in token_gen:
        print(token, end="", flush=True)
    print()


# ─── Interactive mode ───

def interactive_mode(chain_components, use_stream: bool = False):
    """Interactive Q&A loop with chat history and streaming support."""
    print("\n" + "=" * 60)
    print("  🏛 TILI RAG — Assistant Documentaire IA")
    print("  ─" * 28)
    print("  Commandes: quit | reset | stream | verbose")
    print("=" * 60 + "\n")

    chat_history = []
    verbose = False
    streaming = use_stream

    while True:
        try:
            question = input("\n📝 Vous: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\nAu revoir! 👋")
            break

        if not question:
            continue

        cmd = question.lower()
        if cmd in ("quit", "exit", "q"):
            print("Au revoir! 👋")
            break
        if cmd == "reset":
            chat_history = []
            print("🔄 Historique effacé.")
            continue
        if cmd == "stream":
            streaming = not streaming
            print(f"{'✅' if streaming else '❌'} Mode streaming: {'activé' if streaming else 'désactivé'}")
            continue
        if cmd == "verbose":
            verbose = not verbose
            print(f"{'✅' if verbose else '❌'} Mode verbose: {'activé' if verbose else 'désactivé'}")
            continue

        if streaming:
            display_stream(ask_stream(chain_components, question, chat_history))
            # Still track history (non-streamed call for history tracking)
            chat_history.append({"role": "user", "content": question})
            chat_history.append({"role": "assistant", "content": "(streamed)"})
        else:
            response = ask_with_metadata(chain_components, question, chat_history)
            display_response(response, verbose=verbose)
            chat_history.append({"role": "user", "content": question})
            chat_history.append({"role": "assistant", "content": response.answer})

        # Keep history manageable (last 10 exchanges)
        if len(chat_history) > 20:
            chat_history = chat_history[-20:]


def main():
    parser = argparse.ArgumentParser(description="TILI RAG - Document Query (Production Grade)")
    parser.add_argument("--question", "-q", help="Ask a single question")
    parser.add_argument("--summarize", "-s", help="Summarize a specific document (filename)")
    parser.add_argument("--summarize-all", action="store_true", help="Summarize all documents")
    parser.add_argument("--stream", action="store_true", help="Enable streaming mode")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show response metadata")
    args = parser.parse_args()

    # Load vector store
    try:
        vector_store = load_vector_store()
    except FileNotFoundError:
        print("❌ Vector store not found. Run ingestion first:")
        print("   python -m RAG.ingest")
        sys.exit(1)

    chain_components = create_rag_chain(vector_store)

    if args.summarize_all:
        summaries = summarize_all(chain_components)
        for filename, summary in summaries.items():
            print(f"\n{'=' * 60}")
            print(f"📄 {filename}")
            print(f"{'=' * 60}")
            print(summary)

    elif args.summarize:
        summary = summarize_document(chain_components, args.summarize)
        print(f"\n📄 Résumé de: {args.summarize}\n")
        print(summary)

    elif args.question:
        if args.stream:
            display_stream(ask_stream(chain_components, args.question))
        else:
            response = ask_with_metadata(chain_components, args.question)
            display_response(response, verbose=args.verbose)

    else:
        interactive_mode(chain_components, use_stream=args.stream)


if __name__ == "__main__":
    main()
