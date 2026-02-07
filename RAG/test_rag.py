"""
TILI RAG — Performance Test Suite
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
30 questions across 6 categories to evaluate RAG accuracy,
retrieval quality, and edge-case handling.

Usage:
    python -m RAG.test_rag
    python -m RAG.test_rag --category finances
    python -m RAG.test_rag --quick   (5 questions only)
"""

import sys
import time
import json
import logging
import argparse
from typing import List, Dict

import re
import unicodedata

from .vector_store import load_vector_store
from .rag_chain import create_rag_chain, ask_with_metadata, RAGResponse

logging.basicConfig(level=logging.WARNING, format="%(levelname)s - %(message)s")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  TEST CASES — 30 Questions with Expected Facts
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST_CASES = [

    # ──────────────── CATÉGORIE 1: FINANCES ────────────────
    {
        "id": 1,
        "category": "finances",
        "difficulty": "basic",
        "question": "Quel est le budget prévisionnel total de TILI pour 2026 ?",
        "expected_facts": ["350 000 TND"],
        "expected_sources": ["CR_002_Reunion_Strategie_Fevrier_2026.pdf"],
        "description": "Test de récupération d'un chiffre global clé",
    },
    {
        "id": 2,
        "category": "finances",
        "difficulty": "basic",
        "question": "Quel est le taux d'exécution budgétaire du Q1 2026 ?",
        "expected_facts": ["86,1%", "38 742 TND", "45 000 TND"],
        "expected_sources": ["Rapport_Financier_Q1_2026.pdf"],
        "description": "Test de récupération de données financières précises",
    },
    {
        "id": 3,
        "category": "finances",
        "difficulty": "medium",
        "question": "Quel est le coût moyen par bénéficiaire formé au Q1 2026 ?",
        "expected_facts": ["263,5 TND", "147 bénéficiaires"],
        "expected_sources": ["Rapport_Financier_Q1_2026.pdf"],
        "description": "Test de récupération d'un KPI calculé",
    },
    {
        "id": 4,
        "category": "finances",
        "difficulty": "advanced",
        "question": "Détaillez les sources de financement de TILI et leur statut de confirmation.",
        "expected_facts": [
            "Coopération allemande", "100 000", "Confirmé",
            "Union Européenne", "80 000", "En cours",
            "AFD", "120 000", "négociation",
            "Fondation privée", "30 000",
            "Fonds propres", "20 000",
        ],
        "expected_sources": ["CR_002_Reunion_Strategie_Fevrier_2026.pdf"],
        "description": "Test de récupération de tableau complet multi-lignes",
    },
    {
        "id": 5,
        "category": "finances",
        "difficulty": "advanced",
        "question": "Quel est le solde de trésorerie de TILI au 31 mars 2026 et comment est-il calculé ?",
        "expected_facts": ["23 208 TND", "12 450", "49 500", "38 742"],
        "expected_sources": ["Rapport_Financier_Q1_2026.pdf"],
        "description": "Test de récupération d'un calcul de trésorerie",
    },

    # ──────────────── CATÉGORIE 2: PROJETS ────────────────
    {
        "id": 6,
        "category": "projets",
        "difficulty": "basic",
        "question": "Quels sont les trois nouveaux projets prévus en 2026 ?",
        "expected_facts": ["Beta", "Gamma", "Green Jobs", "Women in Tech"],
        "expected_sources": ["CR_Reunion_Strategique_2026-02-01.pdf"],
        "description": "Test de listage de projets principaux",
    },
    {
        "id": 7,
        "category": "projets",
        "difficulty": "medium",
        "question": "Quel est l'objectif et le budget du Projet Beta 'Insertion Digitale' ?",
        "expected_facts": ["300 jeunes", "numérique", "Insertion Digitale"],
        "expected_sources": ["CR_Reunion_Strategique_2026-02-01.pdf"],
        "description": "Test de récupération détaillée d'un projet spécifique",
    },
    {
        "id": 8,
        "category": "projets",
        "difficulty": "medium",
        "question": "Décris le Projet Gamma 'Femmes Entrepreneures Rurales'.",
        "expected_facts": ["50 femmes", "zones rurales", "60 000 TND", "18 mois", "micro-entreprise", "Kairouan", "Kasserine"],
        "expected_sources": ["CR_Reunion_Strategique_2026-02-01.pdf", "Rapport_Mission_Terrain_Kairouan_2026-01-25.pdf"],
        "description": "Test cross-document sur un même projet",
    },
    {
        "id": 9,
        "category": "projets",
        "difficulty": "advanced",
        "question": "Combien de bénéficiaires ont été formés en 2025 et quel était le taux d'insertion ?",
        "expected_facts": ["827", "34%"],
        "expected_sources": ["CR_Reunion_Strategique_2026-02-01.pdf"],
        "description": "Test de récupération de bilan annuel",
    },
    {
        "id": 10,
        "category": "projets",
        "difficulty": "advanced",
        "question": "Quel est l'objectif de bénéficiaires pour le Projet Alpha sur 24 mois et combien ont été formés au Q1 2026 ?",
        "expected_facts": ["800", "147"],
        "expected_sources": ["Rapport_Financier_Q1_2026.pdf"],
        "description": "Test de mise en relation objectif vs réalisation",
    },

    # ──────────────── CATÉGORIE 3: PARTENARIATS ────────────────
    {
        "id": 11,
        "category": "partenariats",
        "difficulty": "basic",
        "question": "Quels sont les engagements de TechSolutions envers TILI ?",
        "expected_facts": ["5 stagiaires", "2 stagiaires", "embauche", "formateur", "200 TND"],
        "expected_sources": ["CONVENTION_001_Partenariat_TechSolutions_2026.pdf"],
        "description": "Test sur une convention spécifique",
    },
    {
        "id": 12,
        "category": "partenariats",
        "difficulty": "medium",
        "question": "Que fournit Orange Tunisie dans le cadre de son partenariat avec TILI ?",
        "expected_facts": ["stagiaires", "mentors", "stage", "Orange Tunisie"],
        "expected_sources": ["Convention_Partenariat_Orange_Tunisie_2026.pdf"],
        "description": "Test de récupération multi-volets d'une convention",
    },
    {
        "id": 13,
        "category": "partenariats",
        "difficulty": "advanced",
        "question": "Quelles entreprises se sont engagées à accueillir des stagiaires à Sfax et combien ?",
        "expected_facts": ["Digital Dreams", "CodeCraft", "DataViz Solutions"],
        "expected_sources": ["RAPPORT_002_Mission_Sfax_Fevrier_2026.pdf"],
        "description": "Test de récupération d'engagements d'entreprises terrain",
    },
    {
        "id": 14,
        "category": "partenariats",
        "difficulty": "advanced",
        "question": "Qui sont les signataires de la convention avec Orange Tunisie ?",
        "expected_facts": ["Asma Ben Hassen", "Brahim Letaief"],
        "expected_sources": ["Convention_Partenariat_Orange_Tunisie_2026.pdf"],
        "description": "Test de récupération de noms précis dans un document juridique",
    },

    # ──────────────── CATÉGORIE 4: MISSIONS TERRAIN ────────────────
    {
        "id": 15,
        "category": "missions",
        "difficulty": "basic",
        "question": "Combien de jeunes ont été sélectionnés lors de la mission à Kasserine ?",
        "expected_facts": ["25", "Kasserine"],
        "expected_sources": ["RAPPORT_001_Mission_Kasserine_Janvier_2026.pdf"],
        "description": "Test de récupération de chiffres de sélection terrain",
    },
    {
        "id": 16,
        "category": "missions",
        "difficulty": "medium",
        "question": "Quel est le taux de chômage des jeunes à Kasserine ?",
        "expected_facts": ["41%"],
        "expected_sources": ["RAPPORT_001_Mission_Kasserine_Janvier_2026.pdf"],
        "description": "Test de statistique locale précise",
    },
    {
        "id": 17,
        "category": "missions",
        "difficulty": "medium",
        "question": "Quels sont les principaux freins identifiés pour les femmes dans la tech à Sfax ?",
        "expected_facts": ["confiance", "89%", "stéréotypes", "72%", "modèles féminins", "67%"],
        "expected_sources": ["RAPPORT_002_Mission_Sfax_Fevrier_2026.pdf"],
        "description": "Test de récupération de résultats de focus group",
    },
    {
        "id": 18,
        "category": "missions",
        "difficulty": "advanced",
        "question": "Décris les 3 parcours de formation recommandés pour les femmes de Sbikha (Kairouan).",
        "expected_facts": ["élevage", "couture", "broderie", "transformation"],
        "expected_sources": ["Rapport_Mission_Terrain_Kairouan_2026-01-25.pdf"],
        "description": "Test de recommandation détaillée d'un rapport de mission",
    },
    {
        "id": 19,
        "category": "missions",
        "difficulty": "advanced",
        "question": "Combien de femmes ont été rencontrées et pré-sélectionnées à Sbikha pour le Projet Gamma ?",
        "expected_facts": ["27", "22"],
        "expected_sources": ["Rapport_Mission_Terrain_Kairouan_2026-01-25.pdf"],
        "description": "Test de chiffres précis d'une mission",
    },

    # ──────────────── CATÉGORIE 5: CROSS-DOCUMENT (AVANCÉ) ────────────────
    {
        "id": 20,
        "category": "cross-document",
        "difficulty": "advanced",
        "question": "Quels gouvernorats sont couverts par TILI et lesquels sont prévus en expansion ?",
        "expected_facts": ["Tunis", "Sfax", "Kasserine", "Kairouan", "Sidi Bouzid", "Gabès", "Médenine", "Tozeur"],
        "expected_sources": [],
        "description": "Test de synthèse multi-documents géographique",
    },
    {
        "id": 21,
        "category": "cross-document",
        "difficulty": "advanced",
        "question": "Qui est Mohamed Aziz Awadhi et quelles sont ses responsabilités ?",
        "expected_facts": ["Mohamed Aziz", "Projet Beta"],
        "expected_sources": [],
        "description": "Test de synthèse sur une personne à travers plusieurs documents",
    },
    {
        "id": 22,
        "category": "cross-document",
        "difficulty": "advanced",
        "question": "Compare les résultats terrain des missions à Kasserine, Sfax et Kairouan.",
        "expected_facts": ["Kasserine", "Sfax", "Kairouan", "25 bénéficiaires", "20 femmes", "22 pré-sélectionnées"],
        "expected_sources": [
            "RAPPORT_001_Mission_Kasserine_Janvier_2026.pdf",
            "RAPPORT_002_Mission_Sfax_Fevrier_2026.pdf",
            "Rapport_Mission_Terrain_Kairouan_2026-01-25.pdf",
        ],
        "description": "Test de comparaison entre 3 missions terrain",
    },
    {
        "id": 23,
        "category": "cross-document",
        "difficulty": "advanced",
        "question": "Quelles sont toutes les formations prévues entre janvier et mars 2026 et combien de participants au total ?",
        "expected_facts": ["formation", "janvier", "participants"],
        "expected_sources": ["Rapport_Financier_Q1_2026.pdf"],
        "description": "Test de consolidation de données de formation",
    },
    {
        "id": 24,
        "category": "cross-document",
        "difficulty": "advanced",
        "question": "Quel est le rôle d'Asma Ben Hassen dans l'organisation TILI ?",
        "expected_facts": ["Directrice", "TILI"],
        "expected_sources": [],
        "description": "Test de synthèse sur la dirigeante principale",
    },

    # ──────────────── CATÉGORIE 6: EDGE CASES & IDK ────────────────
    {
        "id": 25,
        "category": "edge-cases",
        "difficulty": "idk",
        "question": "Quel est le nom du président de la Tunisie mentionné dans les documents ?",
        "expected_facts": ["n'apparaît pas", "pas dans", "pas mentionné", "aucune information"],
        "expected_idk": True,
        "description": "Test IDK — information inexistante dans les documents",
    },
    {
        "id": 26,
        "category": "edge-cases",
        "difficulty": "idk",
        "question": "Quel est le chiffre d'affaires de TILI en 2025 ?",
        "expected_facts": ["n'apparaît pas", "pas dans", "association", "pas mentionné"],
        "expected_idk": True,
        "description": "Test IDK — concept non applicable (association ≠ entreprise)",
    },
    {
        "id": 27,
        "category": "edge-cases",
        "difficulty": "precision",
        "question": "Combien coûte un ordinateur portable acheté par TILI au Q1 2026 ?",
        "expected_facts": ["500 TND", "5 ordinateurs", "2 500"],
        "expected_sources": ["Rapport_Financier_Q1_2026.pdf"],
        "description": "Test de précision — calcul implicite (2500/5 = 500 TND/unité)",
    },
    {
        "id": 28,
        "category": "edge-cases",
        "difficulty": "precision",
        "question": "Combien de pauses café ont coûté les formations du Q1 (coût unitaire par participant par jour) ?",
        "expected_facts": ["12 TND", "2 340"],
        "expected_sources": ["Rapport_Financier_Q1_2026.pdf"],
        "description": "Test de micro-détail financier",
    },
    {
        "id": 29,
        "category": "edge-cases",
        "difficulty": "precision",
        "question": "Quel est le capital social d'Orange Tunisie mentionné dans la convention ?",
        "expected_facts": ["120 000 000 TND"],
        "expected_sources": ["Convention_Partenariat_Orange_Tunisie_2026.pdf"],
        "description": "Test de détail juridique précis dans une convention",
    },
    {
        "id": 30,
        "category": "edge-cases",
        "difficulty": "precision",
        "question": "Quel est le chiffre d'affaires mensuel de 'Fatma's Home' à Sbikha ?",
        "expected_facts": ["1 500 TND", "pâtisserie", "500 TND"],
        "expected_sources": ["Rapport_Mission_Terrain_Kairouan_2026-01-25.pdf"],
        "description": "Test de micro-détail sur une entreprise locale",
    },
]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  EVALUATION ENGINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _normalize_text(text: str) -> str:
    """Normalize text for lenient fact matching.
    Handles French number formatting, Unicode normalization, accents."""
    # NFC normalize to handle composed vs decomposed accents (é vs e+combining)
    text = unicodedata.normalize('NFC', text)
    text = text.lower().strip()
    # Normalize unicode spaces and non-breaking spaces
    text = re.sub(r'[\u00a0\u202f]', ' ', text)
    # Normalize multiple spaces
    text = re.sub(r'\s+', ' ', text)
    return text


def _fact_in_answer(fact: str, answer: str) -> bool:
    """Check if a fact appears in the answer with lenient matching.
    
    Handles:
    - Case insensitive
    - French number formatting: "350 000" matches "350000" or "350 000"
    - Decimal: "86,1%" matches "86.1%" or "86,1%"
    - Partial number matches for small numbers: "25" matches as word boundary
    """
    fact_norm = _normalize_text(fact)
    answer_norm = _normalize_text(answer)

    # Direct substring match
    if fact_norm in answer_norm:
        return True

    # Try removing spaces in numbers: "350 000" → "350000"
    fact_no_space = re.sub(r'(\d)\s+(\d)', r'\1\2', fact_norm)
    answer_no_space = re.sub(r'(\d)\s+(\d)', r'\1\2', answer_norm)
    if fact_no_space in answer_no_space:
        return True

    # Try swapping comma/dot for decimals: "86,1" ↔ "86.1"
    fact_dot = fact_norm.replace(',', '.')
    fact_comma = fact_norm.replace('.', ',')
    if fact_dot in answer_norm or fact_comma in answer_norm:
        return True

    # For pure numbers, do word-boundary match to avoid "2" matching in "2026"
    if re.match(r'^\d+$', fact_norm):
        pattern = r'(?<!\d)' + re.escape(fact_norm) + r'(?!\d)'
        if re.search(pattern, answer_norm):
            return True
        # Also try with spaces removed from answer
        if re.search(pattern, answer_no_space):
            return True

    return False


def evaluate_response(test: Dict, response: RAGResponse) -> Dict:
    """Evaluate a RAG response against expected facts."""
    answer = response.answer
    result = {
        "id": test["id"],
        "category": test["category"],
        "difficulty": test["difficulty"],
        "question": test["question"],
        "description": test["description"],
        "latency_ms": response.latency_ms,
        "confidence": response.confidence,
        "fallback_used": response.fallback_used,
    }

    # Check fact presence with lenient matching
    expected = test["expected_facts"]
    found = []
    missing = []
    for fact in expected:
        if _fact_in_answer(fact, answer):
            found.append(fact)
        else:
            missing.append(fact)

    result["facts_found"] = len(found)
    result["facts_total"] = len(expected)
    result["facts_score"] = round(len(found) / len(expected) * 100, 1) if expected else 100
    result["found"] = found
    result["missing"] = missing

    # Check source correctness
    expected_sources = test.get("expected_sources", [])
    if expected_sources:
        response_sources = [s.filename for s in response.sources]
        source_hits = [s for s in expected_sources if s in response_sources]
        result["source_score"] = round(len(source_hits) / len(expected_sources) * 100, 1)
    else:
        result["source_score"] = None

    # IDK detection
    if test.get("expected_idk"):
        idk_detected = response.fallback_used or any(
            ind in answer for ind in ["n'apparaît pas", "pas dans", "pas mentionné",
                                       "aucune information", "pas d'information",
                                       "impossible de répondre"]
        )
        result["idk_correct"] = idk_detected
    else:
        result["idk_correct"] = None

    # Overall pass/fail
    if test.get("expected_idk"):
        result["passed"] = result["idk_correct"]
    else:
        result["passed"] = result["facts_score"] >= 50  # At least half the facts found

    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  DISPLAY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def print_header():
    print("\n" + "=" * 70)
    print("  🧪 TILI RAG — PERFORMANCE TEST SUITE")
    print("  Testing retrieval accuracy, fact extraction & edge cases")
    print("=" * 70)


def print_result(r: Dict, verbose: bool = False):
    status = "✅" if r["passed"] else "❌"
    cat = r["category"].upper()[:12].ljust(12)
    diff = r["difficulty"][:6].ljust(6)
    facts = f"{r['facts_found']}/{r['facts_total']}"
    src = f"src:{r['source_score']:.0f}%" if r["source_score"] is not None else "src:N/A"
    lat = f"{r['latency_ms']}ms"
    conf = r["confidence"]

    print(f"  {status} Q{r['id']:02d} [{cat}] [{diff}] facts:{facts:>5} | {src:>8} | {lat:>7} | {conf}")

    if verbose and r["missing"]:
        for m in r["missing"]:
            print(f"       ⚠ Manquant: \"{m}\"")

    if r.get("idk_correct") is not None:
        idk_status = "✅ IDK détecté" if r["idk_correct"] else "❌ IDK non détecté"
        print(f"       {idk_status}")


def print_summary(results: List[Dict], elapsed: float):
    passed = sum(1 for r in results if r["passed"])
    total = len(results)
    avg_facts = sum(r["facts_score"] for r in results) / total if total else 0
    avg_latency = sum(r["latency_ms"] for r in results) / total if total else 0

    src_scores = [r["source_score"] for r in results if r["source_score"] is not None]
    avg_src = sum(src_scores) / len(src_scores) if src_scores else 0

    # Per-category breakdown
    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"passed": 0, "total": 0, "facts_avg": []}
        categories[cat]["total"] += 1
        if r["passed"]:
            categories[cat]["passed"] += 1
        categories[cat]["facts_avg"].append(r["facts_score"])

    print("\n" + "=" * 70)
    print("  📊 RÉSULTATS GLOBAUX")
    print("=" * 70)
    print(f"  Tests passés:       {passed}/{total} ({passed/total*100:.0f}%)")
    print(f"  Score faits moyen:  {avg_facts:.1f}%")
    print(f"  Score sources:      {avg_src:.1f}%")
    print(f"  Latence moyenne:    {avg_latency:.0f}ms")
    print(f"  Temps total:        {elapsed:.1f}s")
    print()
    print("  Par catégorie:")
    for cat, data in sorted(categories.items()):
        avg = sum(data["facts_avg"]) / len(data["facts_avg"])
        print(f"    {cat:<16} {data['passed']}/{data['total']} passés | faits: {avg:.0f}%")

    print()
    # Performance grade
    if passed / total >= 0.9 and avg_facts >= 70:
        grade = "🏆 EXCELLENT"
    elif passed / total >= 0.75 and avg_facts >= 55:
        grade = "✅ BON"
    elif passed / total >= 0.5:
        grade = "⚠️ MOYEN"
    else:
        grade = "❌ INSUFFISANT"

    print(f"  Note globale: {grade}")
    print("=" * 70 + "\n")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  MAIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def main():
    parser = argparse.ArgumentParser(description="TILI RAG Performance Tests")
    parser.add_argument("--category", "-c", help="Filter by category (finances, projets, partenariats, missions, cross-document, edge-cases)")
    parser.add_argument("--quick", action="store_true", help="Run only 5 representative questions")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show missing facts")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    parser.add_argument("--question", "-q", type=int, help="Run a single question by ID")
    args = parser.parse_args()

    # Filter tests
    tests = TEST_CASES
    if args.category:
        tests = [t for t in tests if t["category"] == args.category]
    if args.quick:
        quick_ids = [1, 7, 12, 17, 25]  # One per category + IDK
        tests = [t for t in tests if t["id"] in quick_ids]
    if args.question:
        tests = [t for t in tests if t["id"] == args.question]

    if not tests:
        print("❌ Aucun test trouvé avec ces filtres.")
        sys.exit(1)

    # Load RAG
    print_header()
    print(f"\n  Loading RAG system...", end=" ", flush=True)
    vs = load_vector_store()
    chain = create_rag_chain(vs)
    print(f"OK ({vs._collection.count()} vectors)")
    print(f"  Running {len(tests)} tests...\n")

    # Run tests
    results = []
    start = time.time()

    for i, test in enumerate(tests):
        print(f"  [{i+1}/{len(tests)}] Q{test['id']:02d}: {test['question'][:60]}...", end="", flush=True)
        response = ask_with_metadata(chain, test["question"])
        r = evaluate_response(test, response)
        results.append(r)
        status = "✅" if r["passed"] else "❌"
        print(f" {status} ({r['facts_score']:.0f}% | {r['latency_ms']}ms)")

    elapsed = time.time() - start

    # Display
    if args.json:
        # Clean up for JSON serialization
        for r in results:
            r.pop("found", None)
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        print("\n" + "-" * 70)
        print("  DÉTAIL DES RÉSULTATS")
        print("-" * 70)
        for r in results:
            print_result(r, verbose=args.verbose)
        print_summary(results, elapsed)


if __name__ == "__main__":
    main()
