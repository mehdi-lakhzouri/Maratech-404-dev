# 🔍 RAG Pipeline — Retrieval-Augmented Generation

## Vue d'ensemble

Le cœur du système TILI est un pipeline RAG (Retrieval-Augmented Generation) qui permet de poser des questions en langage naturel sur des documents PDF et d'obtenir des réponses précises avec citations des sources.

## Architecture

```
PDF → Chargement → Nettoyage → Classification → Découpage → Embeddings → ChromaDB
                                                                              ↓
Utilisateur → Question → Contextualisation → Recherche vectorielle → LLM → Réponse
```

## Composants

### 1. Ingestion (`RAG/ingest.py`)

Script d'ingestion qui orchestre le pipeline complet :

```bash
python -m RAG.ingest          # Ingestion incrémentale
python -m RAG.ingest --reset  # Réinitialiser et ré-ingérer tout
```

**Étapes :**

1. Chargement des PDFs depuis `docs/pdf/`
2. Nettoyage du texte (suppression artefacts PDF)
3. Classification automatique du type de document (35+ types)
4. Découpage en chunks avec chevauchement
5. Création des embeddings via HuggingFace
6. Stockage persistant dans ChromaDB

### 2. Document Loader (`RAG/document_loader.py`)

- **Chargement** : `PyPDFLoader` de LangChain pour extraire le texte
- **Nettoyage** : Suppression des en-têtes/pieds de page, numéros de page, caractères spéciaux, espaces multiples
- **Classification** : Système à 3 niveaux (voir [02-document-classification.md](02-document-classification.md))
- **Découpage** : `RecursiveCharacterTextSplitter` avec paramètres optimisés

### 3. Vector Store (`RAG/vector_store.py`)

- **Base de données** : ChromaDB (persisté sur disque)
- **Embeddings** : HuggingFace `all-MiniLM-L6-v2` (gratuit, local)
- **Collection** : `tili_documents`
- **Opérations** : Création, chargement, suppression du vector store

### 4. RAG Chain (`RAG/rag_chain.py`) — Le cerveau

**Fonctionnalités avancées :**

| Fonctionnalité           | Description                                                     |
| ------------------------ | --------------------------------------------------------------- |
| **Contextualisation**    | Reformulation des questions avec historique de chat             |
| **MMR Retrieval**        | Maximum Marginal Relevance pour diversifier les résultats       |
| **Score-based Quality**  | Évaluation de la pertinence (haute/moyenne/faible/aucune)       |
| **Token Budget**         | Gestion du budget de tokens (max 12 000 caractères de contexte) |
| **Multi-Query Fallback** | Si résultats faibles → génère 3 reformulations alternatives     |
| **IDK Detection**        | Détection automatique des réponses "je ne sais pas"             |
| **Streaming**            | Support SSE pour réponses en temps réel                         |
| **Résumé**               | Résumé par document avec chunks ordonnés par page               |

**Pipeline de réponse :**

1. Contextualisation de la question (si historique existe)
2. Recherche vectorielle MMR + évaluation des scores
3. Quality gate — rejet si aucun document pertinent
4. Génération de la réponse avec contexte budgétisé
5. Détection IDK
6. Retour structuré avec métadonnées (sources, scores, confiance)

## Paramètres clés (`RAG/config.py`)

| Paramètre            | Valeur               | Description                     |
| -------------------- | -------------------- | ------------------------------- |
| `CHUNK_SIZE`         | 1500                 | Taille des chunks en caractères |
| `CHUNK_OVERLAP`      | 300                  | Chevauchement entre chunks      |
| `RETRIEVAL_K`        | 3                    | Nombre de chunks récupérés      |
| `LLM_MODEL`          | `openai/gpt-4o-mini` | Modèle LLM via OpenRouter       |
| `LLM_TEMPERATURE`    | 0.1                  | Température (réponses précises) |
| `LLM_MAX_TOKENS`     | 400                  | Tokens max par réponse          |
| `EMBEDDING_PROVIDER` | `huggingface`        | Fournisseur d'embeddings        |
| `HUGGINGFACE_MODEL`  | `all-MiniLM-L6-v2`   | Modèle d'embeddings             |

## Seuils de confiance (distance L2 ChromaDB)

| Score     | Confiance | Signification                                 |
| --------- | --------- | --------------------------------------------- |
| < 1.0     | Haute     | Document très pertinent                       |
| 1.0 – 1.4 | Moyenne   | Document possiblement pertinent               |
| 1.4 – 1.8 | Faible    | Document peu pertinent → Multi-Query Fallback |
| > 1.8     | Aucune    | Aucun document pertinent → Message d'erreur   |

## Dépendances Python

```
langchain>=0.3.0
langchain-openai>=0.2.0
langchain-community>=0.3.0
langchain-huggingface>=0.1.0
chromadb>=0.5.0
pypdf>=4.0.0
sentence-transformers>=3.0.0
python-dotenv>=1.0.0
tiktoken>=0.7.0
```
