# 🎙️ Commandes Vocales — Fuzzy Matching Engine

## Vue d'ensemble

Le système de commandes vocales de TILI permet aux utilisateurs (notamment les aveugles et les personnes à mobilité réduite) de contrôler l'application entièrement par la voix. Il utilise un moteur de **fuzzy matching** basé sur la distance de Levenshtein pour reconnaître les commandes même en cas de prononciation imparfaite.

## Architecture

```
Microphone → Web Speech API (STT) → Transcription
                                          ↓
                               Normalisation du texte
                                          ↓
                               Fuzzy Matching Engine
                              (Levenshtein + Similarité)
                                          ↓
                               Dispatch de la commande
                                          ↓
                               Action (navigation, TTS, etc.)
```

## Fichier source

- `web/src/hooks/useVoiceCommands.js` (~700 lignes)

## Algorithme de Fuzzy Matching

### 1. Normalisation

Chaque transcription est normalisée :

- Conversion en minuscules
- Suppression des accents (`é` → `e`, `à` → `a`)
- Suppression de la ponctuation
- Trim des espaces

### 2. Distance de Levenshtein

Calcul du nombre minimum d'opérations (insertion, suppression, substitution) pour transformer une chaîne en une autre.

```
"document" → "documant" = distance 1 (substitution e→a)
```

### 3. Score de similarité

```
similarité = 1 - (levenshtein(a, b) / max(a.length, b.length))
```

Résultat entre 0 (totalement différent) et 1 (identique).

### 4. Fuzzy Contains (3 niveaux)

Pour chaque paire (transcription, synonyme) :

1. **Exact** : La transcription contient exactement le synonyme → score = 1.0
2. **Word-level** : Chaque mot du synonyme est trouvé (≥ 0.85 similarité) dans la transcription
3. **Sliding window** : Fenêtre glissante de la taille du synonyme sur la transcription, meilleur score retenu

### 5. Score pondéré

```
score_final = fuzzy_score + (priorité_commande / 100)
```

Seuil minimum : `FUZZY_THRESHOLD = 0.72`

## Commandes disponibles

### Navigation

| Commande            | Synonymes (exemples)                                | Action                  |
| ------------------- | --------------------------------------------------- | ----------------------- |
| Aller au chat       | "page chat", "ouvre le chat", "va au chat"          | Navigate → `/`          |
| Aller aux documents | "page documents", "mes fichiers", "liste documents" | Navigate → `/documents` |

### Chat

| Commande              | Synonymes                                  | Action                 |
| --------------------- | ------------------------------------------ | ---------------------- |
| Demander [question]   | "pose la question", "cherche", "interroge" | Submit question to RAG |
| Nouvelle conversation | "reset chat", "effacer", "recommencer"     | Clear chat history     |
| Écouter la réponse    | "lis la réponse", "lecture", "parle"       | TTS read last answer   |
| Arrêter la lecture    | "stop", "tais-toi", "silence", "arrête"    | Stop TTS               |
| Aide vocale           | "commandes", "aide", "que peux-tu faire"   | Read help text         |

### Documents

| Commande             | Synonymes                                | Action                   |
| -------------------- | ---------------------------------------- | ------------------------ |
| Résumer document N   | "résumé premier", "ouvre document 2"     | Summarize Nth document   |
| Uploader             | "ajouter fichier", "importer", "charger" | Trigger file upload      |
| Supprimer document N | "efface document 3", "retire"            | Delete Nth document      |
| Lire résumé          | "lis le résumé", "écoute résumé"         | TTS read current summary |

### Interface

| Commande    | Synonymes                           | Action            |
| ----------- | ----------------------------------- | ----------------- |
| Mode sombre | "thème sombre", "dark mode", "nuit" | Toggle dark mode  |
| Mode clair  | "thème clair", "light mode", "jour" | Toggle light mode |

## Extraction d'ordinaux

Le système comprend les ordinaux en français pour les commandes "document N" :

```
"premier" → 1, "deuxième" → 2, "troisième" → 3, ...
"document 5" → 5, "fichier numéro 3" → 3
```

## Hook `useVoiceCommands(handlers)`

```javascript
const {
  isActive, // boolean — commandes vocales actives ?
  lastCommand, // string — dernière commande reconnue
  transcript, // string — transcription brute
  lastHeard, // string — dernière phrase entendue
  unrecognized, // string — dernière phrase non reconnue
  start, // () => void — démarrer l'écoute
  stop, // () => void — arrêter l'écoute
  toggle, // () => void — basculer on/off
  isSupported, // boolean — Web Speech API disponible ?
} = useVoiceCommands({
  onNavigate: (path) => navigate(path),
  onChatAsk: (question) => submitQuestion(question),
  onChatReset: () => clearChat(),
  onChatListen: () => readLastAnswer(),
  onStopSpeech: () => speechSynthesis.cancel(),
  onDarkMode: (on) => setDark(on),
  onDocSummarize: (index) => summarize(index),
  onDocUpload: () => triggerUpload(),
  onDocDelete: (index) => deleteDoc(index),
  onDocReadSummary: () => readSummary(),
});
```

## Indicateur visuel (`VoiceCommandIndicator.jsx`)

Badge flottant en bas de l'écran quand les commandes vocales sont actives :

- Affiche la transcription en temps réel
- Affiche la dernière commande reconnue (vert)
- Affiche les phrases non reconnues (orange)
- Bouton stop pour désactiver
