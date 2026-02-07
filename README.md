# 📘 TILI RAG — Documentation Globale

> **TILI** — Tunisia Inclusive Labor Institute
> Assistant Documentaire IA Accessible ♿

---

## 🗂️ Table des matières

| # | Document | Description |
|---|---|---|
| 01 | [RAG Pipeline](documentation/01-rag-pipeline.md) | Architecture du pipeline RAG : ingestion, embeddings, retrieval, génération |
| 02 | [Classification des Documents](documentation/02-document-classification.md) | Système de classification à 3 niveaux (35+ types) |
| 03 | [API FastAPI](documentation/03-api-endpoints.md) | Tous les endpoints REST : Q&A, résumé, upload, documents, images, santé |
| 04 | [Frontend React](documentation/04-frontend-architecture.md) | Architecture SPA : React 18, Vite 6, TailwindCSS, pages et composants |
| 05 | [Accessibilité](documentation/05-accessibility.md) | TTS, STT, ARIA, navigation clavier, audio guide, earcons, standards WCAG |
| 06 | [Commandes Vocales](documentation/06-voice-commands.md) | Moteur fuzzy matching (Levenshtein), toutes les commandes, indicateur visuel |
| 07 | [Audio Onboarding](documentation/07-audio-onboarding.md) | Modal première visite, détection mode audio, design glass-morphism |
| 08 | [Image Captioning](documentation/08-image-captioning.md) | Description IA des images PDF (GPT-4o-mini Vision), pipeline et cache |
| 09 | [Configuration](documentation/09-configuration.md) | Variables d'environnement, config.py, dépendances, Makefile |

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│                    UTILISATEUR                          │
│  (navigateur web — Chrome/Firefox/Edge)                 │
└──────────┬─────────────────────────────┬────────────────┘
           │                             │
     ┌─────▼──────┐              ┌───────▼────────┐
     │  React SPA │              │  Web Speech API │
     │  (Vite)    │              │  TTS / STT      │
     │  Port 5173 │              └────────────────┘
     └─────┬──────┘
           │ REST + SSE
     ┌─────▼──────────────┐
     │   FastAPI Backend   │
     │   Port 8000         │
     │                     │
     │  ┌───────────────┐  │
     │  │  RAG Pipeline │  │
     │  │  (LangChain)  │  │
     │  └───────┬───────┘  │
     │          │           │
     │  ┌───────▼───────┐  │
     │  │   ChromaDB    │  │
     │  │  (Embeddings) │  │
     │  └───────────────┘  │
     │                     │
     │  ┌───────────────┐  │
     │  │  OpenRouter   │  │
     │  │  GPT-4o-mini  │  │
     │  └───────────────┘  │
     │                     │
     │  ┌───────────────┐  │
     │  │  HuggingFace  │  │
     │  │  all-MiniLM   │  │
     │  │  (Embeddings) │  │
     │  └───────────────┘  │
     └─────────────────────┘
```

## 📁 Structure du projet

```
Hack/
├── 📄 Makefile                    # Commandes make (install, api, web, etc.)
├── 📄 requirements.txt            # Dépendances globales
├── 📄 README.md                   # ← Ce fichier (documentation globale)
│
├── 🐍 RAG/                        # Module Python — Pipeline RAG
│   ├── config.py                  #   Configuration centralisée
│   ├── document_loader.py         #   Chargement + classification des PDFs
│   ├── vector_store.py            #   Gestion ChromaDB (create/load/delete)
│   ├── rag_chain.py               #   Chaîne RAG (Q&A + résumé + streaming)
│   ├── image_captioner.py         #   Description IA des images (Vision)
│   ├── ingest.py                  #   Script d'ingestion
│   ├── query.py                   #   Script de test requêtes
│   ├── .env                       #   Variables d'environnement (clé API)
│   ├── requirements.txt           #   Dépendances Python du module RAG
│   └── chroma_db/                 #   Base vectorielle persistée
│
├── 🌐 api/                        # Serveur FastAPI
│   └── main.py                    #   Endpoints REST + SSE
│
├── ⚛️ web/                        # Frontend React
│   ├── package.json               #   Dépendances Node.js
│   ├── vite.config.js             #   Configuration Vite
│   ├── tailwind.config.js         #   Configuration TailwindCSS
│   └── src/
│       ├── main.jsx               #     Point d'entrée React
│       ├── App.jsx                #     Composant racine (routing, dark mode)
│       ├── api.js                 #     Client API (fetch)
│       ├── index.css              #     Styles globaux
│       ├── pages/
│       │   ├── ChatPage.jsx       #     Page de chat Q&A
│       │   └── DocumentsPage.jsx  #     Page gestion documents
│       ├── components/
│       │   ├── AccessibilityToolbar.jsx  # Barre d'accessibilité
│       │   ├── AudioOnboarding.jsx       # Modal première visite
│       │   └── VoiceCommandIndicator.jsx # Indicateur commandes vocales
│       └── hooks/
│           ├── useSpeech.js       #     TTS + STT
│           ├── useVoiceCommands.js #    Commandes vocales fuzzy
│           └── useAudioGuide.js   #     Guide audio par page
│
└── 📂 docs/                       # Données
    ├── pdf/                       #   PDFs source
    ├── captions/                  #   Cache descriptions images (JSON)
    ├── documentation/             #   Documentation technique (MD)
    └── *.md                       #   Documents Markdown source
```

## 🚀 Démarrage rapide

### Prérequis

- **Python** 3.11+
- **Node.js** 18+
- **Clé API** OpenRouter (gratuite sur [openrouter.ai](https://openrouter.ai))

### Installation

```bash
# 1. Cloner le projet
git clone <repo-url>
cd Hack

# 2. Créer l'environnement Python
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac

# 3. Installer les dépendances
make install
# ou manuellement :
pip install -r RAG/requirements.txt
pip install fastapi "uvicorn[standard]" sse-starlette PyMuPDF Pillow requests
cd web && npm install && cd ..

# 4. Configurer la clé API
# Éditer RAG/.env et ajouter votre clé OpenRouter :
# OPENAI_API_KEY=sk-or-v1-votre-cle-ici

# 5. Ingérer les documents
make ingest

# 6. Démarrer
make dev
# ou séparément :
make api   # Terminal 1 — http://localhost:8000
make web   # Terminal 2 — http://localhost:5173
```

## 🧪 Technologies utilisées

### Backend
| Technologie | Rôle |
|---|---|
| Python 3.13 | Langage backend |
| FastAPI | Framework API REST |
| Uvicorn | Serveur ASGI |
| LangChain | Orchestration RAG |
| ChromaDB | Base vectorielle |
| HuggingFace (all-MiniLM-L6-v2) | Embeddings (gratuit, local) |
| OpenRouter / GPT-4o-mini | LLM pour Q&A, résumé, classification, captioning |
| PyMuPDF | Extraction d'images PDF |
| SSE-Starlette | Streaming Server-Sent Events |

### Frontend
| Technologie | Rôle |
|---|---|
| React 18 | Bibliothèque UI |
| Vite 6 | Build tool |
| TailwindCSS 3.4 | Framework CSS |
| React Router 6 | Navigation SPA |
| React Markdown | Rendu Markdown |
| Web Speech API | TTS + STT natif navigateur |

## ♿ Accessibilité — Résumé

| Fonctionnalité | Pour qui | Comment |
|---|---|---|
| TTS (lecture vocale) | Aveugles | Web Speech API |
| STT (dictée vocale) | Aveugles, moteur | Web Speech API |
| Commandes vocales | Aveugles, moteur | Fuzzy matching Levenshtein |
| Audio Onboarding | Aveugles | Modal première visite |
| Audio Guide | Aveugles | Description auto par page |
| Image Captioning | Aveugles | GPT-4o-mini Vision |
| Navigation clavier | Moteur, aveugles | Alt+1/2/D/V/H |
| ARIA labels | Lecteurs écran | Attributs sémantiques |
| Earcons | Aveugles | Web Audio API |
| Résumés IA | Cognitif | LangChain |
| Classification visuelle | Cognitif | Types + icônes + couleurs |

---

> **Auteur** : Équipe TILI
> **Version** : 1.0.0
> **Date** : Février 2026
