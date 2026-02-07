# 🏷️ Classification Intelligente des Documents

## Vue d'ensemble

Le système TILI détecte automatiquement le type de chaque document PDF uploadé grâce à un système de classification à **3 niveaux** (Tier). Il ne revient **jamais** à "Document Général" — chaque document est classifié précisément.

## Les 3 niveaux de détection

### Tier 1 — Correspondance par préfixe de nom de fichier

Le plus rapide. Analyse le nom du fichier pour détecter le type.

**Exemples :**
| Préfixe | Type détecté |
|---|---|
| `CR_` ou `PV_` | Compte-Rendu |
| `RAPPORT_MISSION` | Rapport de Mission |
| `RAPPORT_FINANCIER` | Rapport Financier |
| `CONVENTION_` | Convention |
| `STATUTS_` | Statuts |
| `NOTE_` | Note de Service |
| `BUDGET_` | Budget Prévisionnel |
| ... | (30+ préfixes reconnus) |

### Tier 2 — Heuristiques par contenu

Si le Tier 1 échoue, analyse le contenu textuel avec des mots-clés.

**Exemples de patterns :**
| Mots-clés trouvés | Type détecté |
|---|---|
| "ordre du jour" + "participants" | Compte-Rendu |
| "mission" + "terrain" + "bénéficiaires" | Rapport de Mission |
| "budget" + "recettes" + "dépenses" | Rapport Financier |
| "article" + "convention" + "signataires" | Convention |
| "évaluation" + "impact" + "recommandations" | Rapport d'Évaluation |

### Tier 3 — Classification par LLM (Deep Analysis)

Si les Tiers 1 et 2 échouent, le contenu est envoyé au LLM (GPT-4o-mini) avec la liste complète des 35+ types et leurs descriptions. Le LLM retourne le type le plus approprié.

## Types de documents supportés (35+)

### Types principaux TILI
- Compte-Rendu
- Rapport de Mission
- Rapport Financier
- Convention
- Rapport d'Activité
- Plan Stratégique

### Types étendus
- Statuts, Règlement Intérieur, Politique RH
- Guide de Formation, Programme de Formation
- Manuel de Procédures, Note de Service
- Lettre Officielle, Projet de Développement
- Étude de Faisabilité, Évaluation de Projet
- Termes de Référence, Rapport d'Évaluation
- Rapport de Suivi, Rapport Annuel
- Budget Prévisionnel, Demande de Financement
- Protocole d'Accord, Charte, Politique Interne
- Formulaire, Fiche de Poste, Organigramme
- Calendrier de Projet, Plan d'Action
- Présentation, Analyse de Données, Enquête / Sondage

## Fichier source

- `RAG/document_loader.py` — Contient `detect_doc_type()`, `DOC_TYPE_MAP`, `KNOWN_TYPES`, `TYPE_DESCRIPTIONS`, et les heuristiques de contenu

## Intégration

La classification s'effectue :
1. **À l'ingestion** (`python -m RAG.ingest`) — chaque PDF est classifié lors du chargement initial
2. **À l'upload** (`POST /upload`) — classification en temps réel quand l'utilisateur uploade un PDF via l'interface

Le type détecté est stocké dans les métadonnées de chaque chunk dans ChromaDB (`doc_type`), ce qui permet :
- Regroupement visuel par type sur la page Documents
- Filtrage contextuel dans les réponses RAG
- Icônes et couleurs spécifiques par type dans l'interface
