# ⚛️ Frontend React — Architecture

## Vue d'ensemble

L'interface utilisateur TILI est une **SPA (Single Page Application)** construite avec React 18, Vite 6, et TailwindCSS 3.4. Elle communique avec le backend FastAPI via des appels REST et SSE.

## Stack technique

| Technologie    | Version | Rôle                             |
| -------------- | ------- | -------------------------------- |
| React          | 18.3    | Bibliothèque UI                  |
| Vite           | 6.0     | Build tool & dev server          |
| TailwindCSS    | 3.4     | Framework CSS utility-first      |
| React Router   | 6.28    | Routing SPA                      |
| React Markdown | 9.0     | Rendu Markdown dans les réponses |

## Structure des fichiers

```
web/src/
├── main.jsx                    # Point d'entrée React
├── App.jsx                     # Composant racine, routing, dark mode, voice commands
├── api.js                      # Client API (fetch vers FastAPI)
├── index.css                   # Styles globaux + Tailwind directives
│
├── pages/
│   ├── ChatPage.jsx            # Page de chat Q&A avec streaming SSE
│   └── DocumentsPage.jsx       # Page gestion documents + upload + résumé
│
├── components/
│   ├── AccessibilityToolbar.jsx # Barre d'outils accessibilité flottante
│   ├── AudioOnboarding.jsx      # Modal première visite (mode audio)
│   └── VoiceCommandIndicator.jsx # Indicateur flottant commandes vocales
│
└── hooks/
    ├── useSpeech.js             # TTS (synthèse vocale) + STT (reconnaissance)
    ├── useVoiceCommands.js      # Moteur de commandes vocales avec fuzzy matching
    └── useAudioGuide.js         # Guide audio automatique par page
```

## Pages

### ChatPage (`pages/ChatPage.jsx`)

Interface de chat avec l'assistant IA :

- **Streaming SSE** : Les réponses s'affichent token par token en temps réel
- **Historique** : Conversation maintenue dans le state, envoyée au backend pour contextualisation
- **Rendu Markdown** : Les réponses sont formatées en Markdown (titres, listes, gras, etc.)
- **Sources** : Affichage des sources avec fichier, page, et niveau de confiance
- **TTS** : Bouton pour écouter la réponse à voix haute
- **Accessibilité** : ARIA labels, focus management, annonces live region

### DocumentsPage (`pages/DocumentsPage.jsx`)

Gestion complète des documents :

- **Liste groupée** : Documents regroupés par type avec icônes et couleurs
- **Upload** : Drag & drop ou sélection de fichier PDF
- **Résumé** : Génération de résumé IA par document (expansible)
- **Suppression** : Suppression avec confirmation
- **Images** : Description IA des images pour les utilisateurs aveugles
- **Stats** : Nombre total de documents, chunks, et types

## Client API (`api.js`)

| Fonction              | Méthode   | Endpoint                       |
| --------------------- | --------- | ------------------------------ |
| `askQuestion()`       | POST      | `/ask`                         |
| `askStream()`         | GET (SSE) | `/ask/stream`                  |
| `getDocuments()`      | GET       | `/documents`                   |
| `summarizeDocument()` | POST      | `/summarize`                   |
| `uploadDocument()`    | POST      | `/upload`                      |
| `deleteDocument()`    | DELETE    | `/documents/{filename}`        |
| `getDocumentImages()` | GET       | `/documents/{filename}/images` |
| `getHealth()`         | GET       | `/health`                      |

## App.jsx — Composant Racine

Responsabilités :

1. **Routing** : `BrowserRouter` avec routes `/` (Chat) et `/documents` (Documents)
2. **Dark Mode** : Toggle clair/sombre avec state `dark`
3. **Voice Commands** : Intégration globale via `useVoiceCommands` hook
4. **Audio Onboarding** : Modal première visite pour les utilisateurs aveugles
5. **Keyboard Shortcuts** : Navigation clavier globale (Alt+1, Alt+2, Alt+D, Alt+V, Alt+H)
6. **Accessibility Toolbar** : Barre d'outils flottante toujours visible

### Raccourcis clavier globaux

| Raccourci | Action                          |
| --------- | ------------------------------- |
| `Alt+1`   | Naviguer vers la page Chat      |
| `Alt+2`   | Naviguer vers la page Documents |
| `Alt+D`   | Toggle thème sombre             |
| `Alt+V`   | Toggle commandes vocales        |
| `Alt+H`   | Lire l'aide des raccourcis      |

## Commandes Make

```bash
make web       # Démarrer le serveur de développement (port 3000/5173)
make install   # Installer les dépendances (npm install)
make dev       # Démarrer API + Web en parallèle
```
