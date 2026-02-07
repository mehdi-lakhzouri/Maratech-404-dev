# ♿ Accessibilité — Fonctionnalités

## Vue d'ensemble

TILI est conçu avec l'accessibilité comme priorité. Le système supporte les utilisateurs **aveugles**, **malvoyants**, et les personnes avec **handicaps moteurs** ou **cognitifs**. Chaque fonctionnalité a été pensée pour être utilisable sans souris, sans vue, et/ou par commande vocale.

## Fonctionnalités par handicap

### 👁️ Utilisateurs aveugles / malvoyants

| Fonctionnalité | Composant | Description |
|---|---|---|
| **TTS (Text-to-Speech)** | `useSpeech.js` | Lecture à voix haute des réponses, résumés, annonces |
| **STT (Speech-to-Text)** | `useSpeech.js` | Dictée vocale pour poser des questions |
| **Commandes vocales** | `useVoiceCommands.js` | Navigation et actions entièrement par la voix |
| **Audio Onboarding** | `AudioOnboarding.jsx` | Première visite : détection du mode audio souhaité |
| **Audio Guide** | `useAudioGuide.js` | Description audio automatique de chaque page |
| **Image Captioning** | `image_captioner.py` | Description IA des images dans les PDFs |
| **ARIA Labels** | Tous composants | Labels sémantiques pour lecteurs d'écran |
| **Skip to Content** | `App.jsx` | Lien "Aller au contenu principal" pour les lecteurs d'écran |
| **Live Regions** | `AccessibilityToolbar.jsx` | Annonces aria-live pour les changements dynamiques |
| **Earcons** | `useAudioGuide.js` | Sons de feedback (clic, succès, erreur, navigation) |

### 🖐️ Utilisateurs avec handicaps moteurs

| Fonctionnalité | Composant | Description |
|---|---|---|
| **Navigation clavier** | `App.jsx` | Raccourcis Alt+1/2/D/V/H pour toute l'app |
| **Commandes vocales** | `useVoiceCommands.js` | Contrôle total de l'app par la voix |
| **Focus management** | Tous composants | Ordre de tabulation logique, focus visible |

### 🧠 Utilisateurs avec handicaps cognitifs

| Fonctionnalité | Composant | Description |
|---|---|---|
| **Résumés IA** | `rag_chain.py` | Résumés structurés et concis des documents |
| **Classification visuelle** | `DocumentsPage.jsx` | Documents regroupés par type avec icônes/couleurs |
| **Interface épurée** | Design | Interface minimaliste, pas de surcharge visuelle |

## Barre d'outils d'accessibilité (`AccessibilityToolbar.jsx`)

Barre flottante toujours visible en bas de l'écran :

- **Fonction `announce(message)`** : Envoie un message au aria-live region pour les lecteurs d'écran
- Accessible via `Alt+A`
- Fournit un point d'accès centralisé aux options d'accessibilité

## TTS — Synthèse vocale (`useSpeech.js`)

### Hook `useTTS()`

```javascript
const { speak, stop, isSpeaking, speakingId, isSupported } = useTTS();

// Lire un texte
speak("Bonjour, voici le résumé du document", { id: "summary-1" });

// Arrêter la lecture
stop();
```

**Caractéristiques :**
- **Chunking intelligent** : Découpe le texte en morceaux de ~150 mots pour éviter les coupures Chrome
- **Nettoyage Markdown** : Supprime les balises Markdown avant la lecture
- **Voix française** : Sélection automatique de la meilleure voix FR disponible
- **Gestion des identifiants** : `speakingId` permet de savoir quel élément est en cours de lecture
- **Anti-chevauchement** : `stop()` annule toute lecture en cours avant d'en démarrer une nouvelle

### Hook `useSTT()`

```javascript
const { startListening, stopListening, isListening, transcript, isSupported } = useSTT({
  lang: "fr-FR",
  onResult: (text) => console.log("Entendu:", text),
  continuous: true,
});
```

**Caractéristiques :**
- Utilise l'API Web Speech (navigateur)
- Mode continu pour les commandes vocales
- Callback `onResult` via ref (pas de re-render)
- Recréation automatique de l'instance si erreur

## Guide audio (`useAudioGuide.js`)

### Hook `useAudioGuide()`

Lit automatiquement une description de la page lors de la première visite :

```javascript
useAudioGuide(
  "Page de chat. Posez une question à l'assistant IA.",
  isDocumentsPage,
  false,   // autoSpeak
  1200     // delay ms
);
```

**Caractéristiques :**
- Lecture automatique uniquement à la première visite (localStorage)
- Délai configurable
- Sons de feedback (`playSound`) : clic, succès, erreur, navigation, alerte

### Earcons (sons de feedback)

```javascript
playSound("click");      // Bip court
playSound("success");    // Son montant
playSound("error");      // Son descendant  
playSound("navigation"); // Double bip
playSound("alert");      // Triple bip
```

Générés via Web Audio API (`OscillatorNode`), aucun fichier audio nécessaire.

## Standards respectés

- **WCAG 2.1 AA** : Contraste, focus visible, labels, structure sémantique
- **ARIA** : `aria-label`, `aria-live`, `aria-expanded`, `role` sur tous les composants interactifs
- **Keyboard Navigation** : Tous les éléments interactifs accessibles au clavier
- **Screen Reader** : Compatible NVDA, JAWS, VoiceOver
