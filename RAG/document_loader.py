"""
TILI RAG - Document Loader & Splitter
Loads PDF files from docs/pdf/, cleans text, splits into chunks.
Smart document type detection: filename → content heuristics → LLM deep analysis.
NEVER defaults to "Document Général" — always classifies specifically.
"""

import re
import logging
from pathlib import Path
from typing import List, Optional

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from . import config

logger = logging.getLogger(__name__)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  DOCUMENT TYPE DETECTION — Smart Classification
#  PRINCIPLE: Always classify specifically, never "Document Général"
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Extended list of known types (no "Document Général")
KNOWN_TYPES = [
    # Core TILI types
    "Compte-Rendu",
    "Rapport de Mission",
    "Rapport Financier",
    "Convention",
    "Rapport d'Activité",
    "Plan Stratégique",
    # Extended types
    "Statuts",
    "Règlement Intérieur",
    "Politique RH",
    "Guide de Formation",
    "Programme de Formation",
    "Manuel de Procédures",
    "Note de Service",
    "Lettre Officielle",
    "Projet de Développement",
    "Étude de Faisabilité",
    "Évaluation de Projet",
    "Termes de Référence",
    "Rapport d'Évaluation",
    "Rapport de Suivi",
    "Rapport Annuel",
    "Budget Prévisionnel",
    "Demande de Financement",
    "Protocole d'Accord",
    "Charte",
    "Politique Interne",
    "Formulaire",
    "Fiche de Poste",
    "Organigramme",
    "Calendrier de Projet",
    "Plan d'Action",
    "Présentation",
    "Analyse de Données",
    "Enquête / Sondage",
]

# Descriptions for LLM classification — helps the LLM distinguish types
TYPE_DESCRIPTIONS = {
    "Compte-Rendu": "Procès-verbal ou compte-rendu d'une réunion, avec ordre du jour, participants, décisions prises",
    "Rapport de Mission": "Rapport suite à une visite terrain ou mission (Kasserine, Sfax, Kairouan, etc.), focus groups, bénéficiaires rencontrés",
    "Rapport Financier": "Bilan financier, exécution budgétaire, trésorerie, recettes et dépenses",
    "Convention": "Accord ou convention de partenariat entre organisations, avec articles, signataires, obligations",
    "Rapport d'Activité": "Bilan annuel des activités réalisées, indicateurs de performance, résultats",
    "Plan Stratégique": "Vision long terme, axes stratégiques, feuille de route, objectifs pluriannuels",
    "Statuts": "Statuts juridiques d'une association ou organisation, objet social, siège, membres",
    "Règlement Intérieur": "Règles internes de fonctionnement d'une organisation",
    "Politique RH": "Politique de ressources humaines, recrutement, formation, gestion du personnel",
    "Guide de Formation": "Guide ou support pédagogique pour une formation",
    "Programme de Formation": "Programme détaillé d'une formation avec modules, horaires, objectifs pédagogiques",
    "Manuel de Procédures": "Procédures opérationnelles, workflows, processus internes",
    "Note de Service": "Communication interne officielle, directive, instruction",
    "Lettre Officielle": "Correspondance formelle entre organisations ou personnes",
    "Projet de Développement": "Description d'un projet de développement, objectifs, bénéficiaires, activités",
    "Étude de Faisabilité": "Analyse de faisabilité d'un projet, risques, opportunités",
    "Évaluation de Projet": "Évaluation d'un projet terminé ou en cours, résultats, impact",
    "Termes de Référence": "TdR pour un consultant, une mission, un recrutement",
    "Rapport d'Évaluation": "Rapport d'évaluation intermédiaire ou finale d'un programme",
    "Rapport de Suivi": "Suivi régulier d'un projet ou programme, indicateurs, avancement",
    "Rapport Annuel": "Rapport annuel complet d'une organisation (activité + financier + perspectives)",
    "Budget Prévisionnel": "Budget détaillé prévisionnel pour un projet ou une période",
    "Demande de Financement": "Dossier de demande de subvention ou financement",
    "Protocole d'Accord": "Accord préliminaire ou protocole d'entente entre parties",
    "Charte": "Charte de valeurs, d'éthique, ou de qualité d'une organisation",
    "Politique Interne": "Document de politique interne (anti-corruption, genre, environnement, etc.)",
    "Formulaire": "Formulaire administratif à remplir (inscription, demande, évaluation)",
    "Fiche de Poste": "Description d'un poste, responsabilités, compétences requises",
    "Organigramme": "Structure organisationnelle, hiérarchie, organigramme",
    "Calendrier de Projet": "Planning, chronogramme, calendrier d'activités",
    "Plan d'Action": "Plan d'action opérationnel avec activités, responsables, délais",
    "Présentation": "Présentation institutionnelle, slides, pitch deck",
    "Analyse de Données": "Analyse statistique, données quantitatives, graphiques, tableaux",
    "Enquête / Sondage": "Résultats d'enquête, questionnaire, sondage auprès de bénéficiaires",
}

# ── Tier 1: Filename prefix matching ──
DOC_TYPE_MAP = {
    "CR_": "Compte-Rendu",
    "PV_": "Compte-Rendu",
    "RAPPORT_MISSION": "Rapport de Mission",
    "RAPPORT_ACTIVITE": "Rapport d'Activité",
    "RAPPORT_FINANCIER": "Rapport Financier",
    "RAPPORT_EVALUATION": "Rapport d'Évaluation",
    "RAPPORT_SUIVI": "Rapport de Suivi",
    "RAPPORT_ANNUEL": "Rapport Annuel",
    "Rapport_Mission": "Rapport de Mission",
    "Rapport_Financier": "Rapport Financier",
    "Rapport_Activite": "Rapport d'Activité",
    "CONVENTION_": "Convention",
    "Convention_": "Convention",
    "Accord_": "Convention",
    "Protocole_": "Protocole d'Accord",
    "Plan_Strategique": "Plan Stratégique",
    "Plan_Action": "Plan d'Action",
    "Plan_": "Plan Stratégique",
    "Budget_": "Budget Prévisionnel",
    "Statuts_": "Statuts",
    "Guide_": "Guide de Formation",
    "Programme_": "Programme de Formation",
    "Manuel_": "Manuel de Procédures",
    "Note_": "Note de Service",
    "Lettre_": "Lettre Officielle",
    "Fiche_": "Fiche de Poste",
    "TDR_": "Termes de Référence",
    "Charte_": "Charte",
    "Formulaire_": "Formulaire",
    "Enquete_": "Enquête / Sondage",
}


def _detect_by_filename(filename: str) -> Optional[str]:
    """Tier 1: Detect document type from filename prefix or keywords."""
    fn_upper = filename.upper()
    # Check prefix matches (longer prefixes first for specificity)
    sorted_prefixes = sorted(DOC_TYPE_MAP.keys(), key=len, reverse=True)
    for prefix in sorted_prefixes:
        if fn_upper.startswith(prefix.upper()):
            return DOC_TYPE_MAP[prefix]

    # Check keyword matches in filename
    filename_lower = filename.lower().replace("-", "_").replace(" ", "_")
    keyword_map = {
        "convention": "Convention",
        "partenariat": "Convention",
        "protocole": "Protocole d'Accord",
        "rapport_financier": "Rapport Financier",
        "financier": "Rapport Financier",
        "budget": "Budget Prévisionnel",
        "tresorerie": "Rapport Financier",
        "mission": "Rapport de Mission",
        "terrain": "Rapport de Mission",
        "reunion": "Compte-Rendu",
        "compte_rendu": "Compte-Rendu",
        "compte-rendu": "Compte-Rendu",
        "proces_verbal": "Compte-Rendu",
        "strategique": "Plan Stratégique",
        "activite": "Rapport d'Activité",
        "plan_action": "Plan d'Action",
        "plan": "Plan Stratégique",
        "statuts": "Statuts",
        "reglement": "Règlement Intérieur",
        "politique": "Politique Interne",
        "guide": "Guide de Formation",
        "formation": "Programme de Formation",
        "manuel": "Manuel de Procédures",
        "procedure": "Manuel de Procédures",
        "note_service": "Note de Service",
        "lettre": "Lettre Officielle",
        "projet": "Projet de Développement",
        "evaluation": "Rapport d'Évaluation",
        "faisabilite": "Étude de Faisabilité",
        "tdr": "Termes de Référence",
        "termes_reference": "Termes de Référence",
        "charte": "Charte",
        "organigramme": "Organigramme",
        "fiche_poste": "Fiche de Poste",
        "calendrier": "Calendrier de Projet",
        "enquete": "Enquête / Sondage",
        "sondage": "Enquête / Sondage",
        "formulaire": "Formulaire",
        "presentation": "Présentation",
        "annuel": "Rapport Annuel",
    }
    for keyword, doc_type in keyword_map.items():
        if keyword in filename_lower:
            return doc_type
    return None


# ── Tier 2: Content-based heuristics (expanded) ──
CONTENT_PATTERNS = {
    "Convention": [
        r"(?i)convention\s+de\s+partenariat",
        r"(?i)entre\s+les?\s+soussign[ée]s?",
        r"(?i)article\s+\d+\s*[:\-–]",
        r"(?i)objet\s+de\s+la\s+convention",
        r"(?i)signataires",
        r"(?i)en\s+foi\s+de\s+quoi",
        r"(?i)dur[ée]e\s+de\s+la\s+convention",
        r"(?i)obligations?\s+des?\s+parties",
        r"(?i)r[ée]siliation",
        r"(?i)clause\s+r[ée]solutoire",
    ],
    "Rapport Financier": [
        r"(?i)rapport\s+financier",
        r"(?i)ex[ée]cution\s+budg[ée]taire",
        r"(?i)tr[ée]sorerie",
        r"(?i)budget\s+pr[ée]visionnel",
        r"(?i)recettes?\s+et\s+d[ée]penses",
        r"(?i)solde\s+de\s+tr[ée]sorerie",
        r"(?i)comptabilit[ée]",
        r"(?i)bilan\s+financier",
        r"(?i)charges?\s+et\s+produits",
        r"(?i)audit\s+financier",
    ],
    "Rapport de Mission": [
        r"(?i)rapport\s+de\s+mission",
        r"(?i)mission\s+terrain",
        r"(?i)objectifs?\s+de\s+la\s+mission",
        r"(?i)focus\s+group",
        r"(?i)visite\s+de\s+terrain",
        r"(?i)b[ée]n[ée]ficiaires?\s+rencontr[ée]s",
        r"(?i)recommandations?\s+terrain",
        r"(?i)d[ée]roulement\s+de\s+la\s+mission",
        r"(?i)entretiens?\s+(avec|aupr[èe]s)",
        r"(?i)observations?\s+terrain",
    ],
    "Compte-Rendu": [
        r"(?i)compte[\s-]rendu",
        r"(?i)proc[èe]s[\s-]verbal",
        r"(?i)ordre\s+du\s+jour",
        r"(?i)participants?\s+pr[ée]sents?",
        r"(?i)d[ée]cisions?\s+prises?",
        r"(?i)prochaine\s+r[ée]union",
        r"(?i)r[ée]union\s+(du|de|strat[ée]gique|projet)",
        r"(?i)points?\s+discut[ée]s",
        r"(?i)liste\s+de\s+pr[ée]sence",
    ],
    "Rapport d'Activité": [
        r"(?i)rapport\s+d[''\u2019]activit[ée]",
        r"(?i)bilan\s+annuel",
        r"(?i)r[ée]alisations?\s+de\s+l[''\u2019]ann[ée]e",
        r"(?i)indicateurs?\s+de\s+performance",
        r"(?i)activit[ée]s?\s+r[ée]alis[ée]es",
        r"(?i)r[ée]sultats?\s+atteints",
        r"(?i)bilan\s+des?\s+activit[ée]s",
    ],
    "Plan Stratégique": [
        r"(?i)plan\s+strat[ée]gique",
        r"(?i)vision\s+\d{4}",
        r"(?i)axes?\s+strat[ée]giques?",
        r"(?i)feuille\s+de\s+route",
        r"(?i)orientations?\s+strat[ée]giques?",
        r"(?i)objectifs?\s+strat[ée]giques?",
    ],
    "Statuts": [
        r"(?i)statuts?\s+(de\s+l[''\u2019]association|constitutifs?)",
        r"(?i)objet\s+social",
        r"(?i)si[èe]ge\s+social",
        r"(?i)assembl[ée]e\s+g[ée]n[ée]rale",
        r"(?i)conseil\s+d[''\u2019]administration",
        r"(?i)dissolution",
    ],
    "Règlement Intérieur": [
        r"(?i)r[èe]glement\s+int[ée]rieur",
        r"(?i)dispositions?\s+g[ée]n[ée]rales?",
        r"(?i)sanctions?\s+disciplinaires?",
        r"(?i)droits?\s+et\s+devoirs",
    ],
    "Politique RH": [
        r"(?i)politique\s+(de\s+)?ressources?\s+humaines",
        r"(?i)recrutement",
        r"(?i)gestion\s+du\s+personnel",
        r"(?i)grille\s+salariale",
        r"(?i)cong[ée]s?\s+(annuels?|pay[ée]s)",
    ],
    "Guide de Formation": [
        r"(?i)guide\s+(de\s+)?formation",
        r"(?i)support\s+p[ée]dagogique",
        r"(?i)objectifs?\s+p[ée]dagogiques?",
        r"(?i)module\s+\d+",
        r"(?i)exercices?\s+pratiques?",
    ],
    "Programme de Formation": [
        r"(?i)programme\s+de\s+formation",
        r"(?i)modules?\s+de\s+formation",
        r"(?i)dur[ée]e\s+de\s+la\s+formation",
        r"(?i)formateurs?",
        r"(?i)public\s+cible",
    ],
    "Manuel de Procédures": [
        r"(?i)manuel\s+de\s+proc[ée]dures?",
        r"(?i)proc[ée]dure\s+op[ée]rationnelle",
        r"(?i)workflow",
        r"(?i)[ée]tapes?\s+du\s+processus",
    ],
    "Projet de Développement": [
        r"(?i)projet\s+de\s+d[ée]veloppement",
        r"(?i)cadre\s+logique",
        r"(?i)b[ée]n[ée]ficiaires?\s+(directs?|indirects?)",
        r"(?i)r[ée]sultats?\s+attendus",
        r"(?i)activit[ée]s?\s+pr[ée]vues",
        r"(?i)zone\s+d[''\u2019]intervention",
    ],
    "Termes de Référence": [
        r"(?i)termes?\s+de\s+r[ée]f[ée]rence",
        r"(?i)TdR",
        r"(?i)profil\s+recherch[ée]",
        r"(?i)livrables?",
        r"(?i)dur[ée]e\s+de\s+la\s+mission",
    ],
    "Rapport d'Évaluation": [
        r"(?i)rapport\s+d[''\u2019][ée]valuation",
        r"(?i)[ée]valuation\s+(finale?|interm[ée]diaire|[àa]\s+mi-parcours)",
        r"(?i)crit[èe]res?\s+d[''\u2019][ée]valuation",
        r"(?i)recommandations?",
        r"(?i)le[çc]ons?\s+apprises",
    ],
    "Demande de Financement": [
        r"(?i)demande\s+de\s+(financement|subvention)",
        r"(?i)dossier\s+de\s+candidature",
        r"(?i)montant\s+demand[ée]",
        r"(?i)bailleur",
        r"(?i)co-?financement",
    ],
    "Budget Prévisionnel": [
        r"(?i)budget\s+pr[ée]visionnel",
        r"(?i)ligne\s+budg[ée]taire",
        r"(?i)co[ûu]ts?\s+unitaires?",
        r"(?i)total\s+g[ée]n[ée]ral",
        r"(?i)ventilation\s+(du\s+)?budget",
    ],
    "Protocole d'Accord": [
        r"(?i)protocole\s+d[''\u2019]accord",
        r"(?i)protocole\s+d[''\u2019]entente",
        r"(?i)m[ée]morandum",
        r"(?i)parties?\s+contractantes?",
    ],
    "Plan d'Action": [
        r"(?i)plan\s+d[''\u2019]action",
        r"(?i)chronogramme",
        r"(?i)responsables?\s+:",
        r"(?i)d[ée]lais?\s+:",
        r"(?i)jalons?",
    ],
    "Rapport Annuel": [
        r"(?i)rapport\s+annuel",
        r"(?i)ann[ée]e\s+\d{4}",
        r"(?i)mot\s+du\s+pr[ée]sident",
        r"(?i)faits?\s+marquants?",
        r"(?i)perspectives?\s+\d{4}",
    ],
    "Charte": [
        r"(?i)charte\s+(de|d[''\u2019]|du)",
        r"(?i)valeurs?\s+fondamentales?",
        r"(?i)engagements?\s+:",
        r"(?i)principes?\s+directeurs?",
    ],
    "Enquête / Sondage": [
        r"(?i)enqu[êe]te\s+(de\s+satisfaction|aupr[èe]s)",
        r"(?i)r[ée]sultats?\s+du\s+sondage",
        r"(?i)questionnaire",
        r"(?i)[ée]chantillon",
        r"(?i)m[ée]thodologie\s+d[''\u2019]enqu[êe]te",
    ],
    "Fiche de Poste": [
        r"(?i)fiche\s+de\s+poste",
        r"(?i)intitul[ée]\s+du\s+poste",
        r"(?i)missions?\s+principales?",
        r"(?i)comp[ée]tences?\s+requises?",
        r"(?i)rattachement\s+hi[ée]rarchique",
    ],
    "Note de Service": [
        r"(?i)note\s+de\s+service",
        r"(?i)note\s+interne",
        r"(?i)objet\s*:",
        r"(?i)pour\s+(information|action|diffusion)",
    ],
    "Présentation": [
        r"(?i)pr[ée]sentation\s+(de|du|institutionnelle)",
        r"(?i)qui\s+sommes[\s-]nous",
        r"(?i)notre\s+(mission|vision)",
        r"(?i)chiffres?\s+cl[ée]s?",
    ],
}


def _detect_by_content(text: str) -> Optional[str]:
    """Tier 2: Detect document type from content patterns.
    Scores each type by number of pattern matches, returns the best.
    Threshold lowered to 1 — even a single strong match is informative."""
    if not text or len(text) < 50:
        return None

    # Scan first ~5000 chars for better coverage
    sample = text[:5000]
    scores = {}

    for doc_type, patterns in CONTENT_PATTERNS.items():
        score = sum(1 for p in patterns if re.search(p, sample))
        if score >= 1:  # Accept even 1 match — LLM will confirm if ambiguous
            scores[doc_type] = score

    if not scores:
        return None

    best_type = max(scores, key=scores.get)
    best_score = scores[best_type]

    # If tie or low confidence (only 1 match), still return it but log
    if best_score == 1:
        logger.info(f"  Content detection (low confidence): {scores} → '{best_type}'")
    else:
        logger.info(f"  Content detection (confident): {scores} → '{best_type}'")
    return best_type


# ── Tier 3: LLM-based deep classification ──
def _detect_by_llm(text: str, filename: str) -> str:
    """Tier 3: Use LLM to deeply analyze document content and classify.
    NEVER returns 'Document Général' — always picks a specific type."""
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.output_parsers import StrOutputParser
        from langchain_core.prompts import ChatPromptTemplate

        llm = ChatOpenAI(
            model=config.LLM_MODEL,
            temperature=0,
            max_tokens=100,
            openai_api_key=config.OPENAI_API_KEY,
            openai_api_base=config.OPENAI_BASE_URL,
        )

        # Build a rich list of types with descriptions
        types_list = "\n".join(
            f"- **{t}**: {TYPE_DESCRIPTIONS.get(t, '')}"
            for t in KNOWN_TYPES
        )

        classify_prompt = ChatPromptTemplate.from_messages([
            ("system",
             "Tu es un expert en classification de documents d'associations et d'ONG.\n\n"
             "RÈGLES STRICTES:\n"
             "1. Tu DOIS choisir le type le PLUS SPÉCIFIQUE qui correspond au contenu.\n"
             "2. Tu ne dois JAMAIS répondre 'Document Général' — ce n'est PAS une option.\n"
             "3. Analyse en profondeur le contenu, la structure, le vocabulaire et le contexte.\n"
             "4. Si le document ne correspond à aucun type listé, invente un type descriptif "
             "en français (ex: 'Rapport de Monitoring', 'Plan de Communication', etc.).\n\n"
             "TYPES DISPONIBLES:\n"
             f"{types_list}\n\n"
             "INSTRUCTIONS:\n"
             "- Lis attentivement l'extrait du document.\n"
             "- Identifie les éléments clés: structure, vocabulaire, objectif du document.\n"
             "- Choisis le type le plus précis possible.\n"
             "- Réponds UNIQUEMENT avec le nom du type (ex: 'Rapport de Mission'), rien d'autre."),
            ("human",
             "Fichier: {filename}\n\n"
             "--- EXTRAIT DU DOCUMENT (premiers ~3000 caractères) ---\n{excerpt}\n---"),
        ])

        chain = classify_prompt | llm | StrOutputParser()
        result = chain.invoke({
            "filename": filename,
            "excerpt": text[:3000],
        }).strip().strip('"').strip("'").strip("*")

        # Check if result matches a known type (fuzzy)
        result_lower = result.lower()
        for known in KNOWN_TYPES:
            if known.lower() == result_lower or known.lower() in result_lower:
                logger.info(f"  LLM classification: '{result}' → '{known}'")
                return known

        # If LLM suggests a new specific type, accept it!
        # This allows dynamic type creation for unknown document types.
        if result and "général" not in result_lower and "general" not in result_lower:
            # Clean up the result
            clean_result = result.split("\n")[0].strip()
            if 3 <= len(clean_result) <= 50:
                logger.info(f"  LLM classified as NEW type: '{clean_result}'")
                return clean_result

        # Absolute last resort: analyze the document's main theme
        logger.warning(f"  LLM result '{result}' was unclear, trying theme extraction...")
        return _extract_theme_type(text, filename)

    except Exception as e:
        logger.warning(f"  LLM classification failed: {e}")
        return _extract_theme_type(text, filename)


def _extract_theme_type(text: str, filename: str) -> str:
    """Emergency fallback: extract the main theme from text to create a type name."""
    # Quick content analysis without LLM
    text_lower = text[:5000].lower()

    # Check for broad thematic keywords
    theme_keywords = [
        (r"(?i)(inclusion|inclusif|inclusiv)", "Rapport d'Inclusion"),
        (r"(?i)(emploi|travail|insertion\s+professionnelle)", "Rapport sur l'Emploi"),
        (r"(?i)(handicap|pmr|accessibilit[ée])", "Rapport Handicap & Accessibilité"),
        (r"(?i)(genre|[ée]galit[ée]|femmes?)", "Rapport Genre & Égalité"),
        (r"(?i)(jeunes?|jeunesse|youth)", "Rapport Jeunesse"),
        (r"(?i)(sant[ée]|m[ée]dical)", "Rapport Santé"),
        (r"(?i)([ée]ducation|scolaire|[ée]cole)", "Rapport Éducation"),
        (r"(?i)(agricult|rural|paysan)", "Rapport Agriculture"),
        (r"(?i)(num[ée]rique|digital|technolog)", "Rapport Numérique"),
        (r"(?i)(environnement|climat|[ée]colog)", "Rapport Environnement"),
        (r"(?i)(droits?\s+humains?|droits?\s+de\s+l[''\u2019]homme)", "Rapport Droits Humains"),
        (r"(?i)(microfinance|micro-cr[ée]dit|AGR)", "Rapport Microfinance"),
        (r"(?i)(communaut[ée]|communautaire)", "Rapport Communautaire"),
        (r"(?i)(plaidoyer|advocacy)", "Note de Plaidoyer"),
        (r"(?i)(communication|m[ée]dia|presse)", "Document de Communication"),
        (r"(?i)(suivi|monitoring|S&E)", "Rapport de Suivi"),
        (r"(?i)(capitalisation|le[çc]ons)", "Document de Capitalisation"),
    ]

    for pattern, doc_type in theme_keywords:
        if re.search(pattern, text_lower):
            logger.info(f"  Theme extraction: '{doc_type}'")
            return doc_type

    # Truly last resort: use filename to construct a type
    clean_name = Path(filename).stem.replace("_", " ").replace("-", " ").title()
    fallback_type = f"Document: {clean_name[:40]}"
    logger.info(f"  Using filename-based type: '{fallback_type}'")
    return fallback_type


def detect_doc_type(filename: str, text: str = "") -> str:
    """
    Smart document type detection — ALWAYS returns a specific type.
    1. Filename pattern matching (fast, no API call)
    2. Content heuristics with regex patterns (fast, no API call)
    3. LLM deep analysis (uses API for best accuracy)
    4. Theme extraction fallback (never returns 'Document Général')
    """
    logger.info(f"  Detecting type for: '{filename}'")

    # Tier 1: Filename
    result = _detect_by_filename(filename)
    if result:
        logger.info(f"  → Tier 1 (filename): '{result}'")
        return result

    # Tier 2: Content patterns
    result = _detect_by_content(text)
    if result:
        logger.info(f"  → Tier 2 (content): '{result}'")
        return result

    # Tier 3: LLM deep classification (ALWAYS called if Tier 1+2 fail)
    if text and len(text) > 50:
        logger.info(f"  → Tier 3 (LLM deep analysis) for '{filename}'")
        return _detect_by_llm(text, filename)

    # Tier 4: Theme extraction from whatever text we have
    if text:
        return _extract_theme_type(text, filename)

    # Only if no text at all — create type from filename
    clean_name = Path(filename).stem.replace("_", " ").replace("-", " ").title()
    return f"Document: {clean_name[:40]}"


# ─── Text Cleaning ───
def clean_pdf_text(text: str) -> str:
    """
    Clean common PDF extraction artifacts.
    - Fix 's p a c e d' text (common in xhtml2pdf output)
    - Normalize whitespace
    - Fix broken French accents
    """
    if not text:
        return ""

    # Fix spaced-out text: "A m o t i v a t e d" → "A motivated"
    # Heuristic: sequences of single chars separated by spaces
    def fix_spaced(match):
        chars = match.group(0).replace(" ", "")
        return chars

    # Detect patterns like "a b c d e" (single char + space repeated 4+ times)
    text = re.sub(r'(?<!\S)(\S ){4,}\S(?!\S)', fix_spaced, text)

    # Normalize multiple spaces to single
    text = re.sub(r' {2,}', ' ', text)

    # Normalize multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Fix common broken unicode
    text = text.replace('â€™', "'")
    text = text.replace('â€"', "–")
    text = text.replace('â€œ', '"')
    text = text.replace('â€\x9d', '"')
    text = text.replace('Ã©', 'é')
    text = text.replace('Ã¨', 'è')
    text = text.replace('Ã ', 'à')
    text = text.replace('Ã§', 'ç')

    return text.strip()


# ─── Load PDFs ───
def load_pdfs(directory: Path = None) -> List[Document]:
    """
    Load all PDF files from the given directory.
    Each page becomes a Document with metadata (source, page, doc_type).
    """
    if directory is None:
        directory = config.PDF_SOURCE_DIR

    directory = Path(directory)
    if not directory.exists():
        raise FileNotFoundError(f"PDF directory not found: {directory}")

    pdf_files = sorted(directory.glob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(f"No PDF files found in: {directory}")

    logger.info(f"Found {len(pdf_files)} PDF files in '{directory}'")

    all_docs: List[Document] = []

    for pdf_path in pdf_files:
        try:
            loader = PyPDFLoader(str(pdf_path))
            pages = loader.load()

            filename = pdf_path.name

            # Combine first pages text for smart type detection
            combined_text = "\n".join(p.page_content for p in pages[:3])
            doc_type = detect_doc_type(filename, combined_text)

            for page in pages:
                # Clean the text
                page.page_content = clean_pdf_text(page.page_content)

                # Enrich metadata
                page.metadata["filename"] = filename
                page.metadata["doc_type"] = doc_type
                page.metadata["doc_title"] = filename.replace(".pdf", "").replace("_", " ")

            all_docs.extend(pages)
            logger.info(f"  Loaded: {filename} ({len(pages)} pages, type: {doc_type})")

        except Exception as e:
            logger.error(f"  FAILED to load {pdf_path.name}: {e}")
            continue

    logger.info(f"Total pages loaded: {len(all_docs)}")
    return all_docs


# ─── Split Documents ───
def split_documents(documents: List[Document]) -> List[Document]:
    """
    Split documents into chunks using RecursiveCharacterTextSplitter.
    Preserves metadata from original documents.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE,
        chunk_overlap=config.CHUNK_OVERLAP,
        separators=config.SEPARATORS,
        length_function=len,
    )

    chunks = splitter.split_documents(documents)
    logger.info(f"Split {len(documents)} pages into {len(chunks)} chunks "
                f"(chunk_size={config.CHUNK_SIZE}, overlap={config.CHUNK_OVERLAP})")
    return chunks


# ─── Combined Pipeline ───
def load_and_split(directory: Path = None) -> List[Document]:
    """Full pipeline: Load PDFs → Clean → Split → Return chunks."""
    docs = load_pdfs(directory)
    chunks = split_documents(docs)
    return chunks


# ─── CLI Test ───
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")
    chunks = load_and_split()
    print(f"\n{'='*50}")
    print(f"Loaded and split into {len(chunks)} chunks")
    print(f"{'='*50}")

    # Show sample
    if chunks:
        sample = chunks[0]
        print(f"\nSample chunk (first 300 chars):")
        print(f"  Metadata: {sample.metadata}")
        print(f"  Content:  {sample.page_content[:300]}...")
