# 🎧 Audio Onboarding — Première visite

## Vue d'ensemble

L'Audio Onboarding est un modal qui s'affiche uniquement lors de la **première visite** de l'utilisateur. Il demande à l'utilisateur s'il souhaite utiliser le **mode audio** (commandes vocales + lecture automatique). Cette fonctionnalité est cruciale pour les utilisateurs aveugles qui ne peuvent pas voir l'interface au premier chargement.

## Fonctionnement

### Flux utilisateur

```
Première visite → Modal apparaît
    ↓
TTS parle : "Bienvenue sur TILI. Voulez-vous activer le mode audio ?"
    ↓
L'utilisateur répond par :
  • Voix : "oui" / "non"
  • Clavier : O/Entrée (oui) ou N/Échap (non)
  • Souris : Boutons visuels
    ↓
Choix sauvegardé dans localStorage
    ↓
Si "oui" → Commandes vocales activées automatiquement après 1.5s
```

### Persistance

- `localStorage["tili-onboarding-done"]` = `"true"` — Onboarding terminé
- `localStorage["tili-audio-mode"]` = `"true"` / `"false"` — Mode audio choisi

### Rechargement de page

Si l'utilisateur a choisi le mode audio, les commandes vocales sont automatiquement réactivées à chaque rechargement (via `audioAutoStarted` ref dans `App.jsx`).

## Design

### Interface visuelle (glass-morphism)

- **Backdrop** : Gradient animé (tili-600 → violet-600 → indigo-600)
- **Carte** : Fond semi-transparent avec `backdrop-blur-xl`, bordure blanche/20%
- **Icône flottante** : Emoji ♿ avec animation `float` + anneaux de pulse
- **Boutons** : Cards avec icônes, texte principal et sous-texte, effet hover avec scale
- **Animations** : `fadeIn`, `slideUp`, `pulseRing`, `float` (définies dans Tailwind config)

### Accessibilité de la modal

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Focus automatique sur le premier bouton
- Réponse vocale et clavier en parallèle du visuel
- TTS commence à parler après 800ms (temps de rendu)
- STT écoute simultanément pour "oui" / "non"

## Fichier source

- `web/src/components/AudioOnboarding.jsx`

## Exports

```javascript
// Composant principal
export default AudioOnboarding;

// Fonctions utilitaires (utilisées par App.jsx)
export function isOnboardingDone();    // boolean — déjà fait ?
export function isAudioModeEnabled();  // boolean — mode audio activé ?
```

## Intégration dans App.jsx

```jsx
const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingDone());
const [audioMode, setAudioMode] = useState(() => isAudioModeEnabled());

// Callback quand l'utilisateur fait son choix
const handleOnboardingComplete = (chosenAudioMode) => {
  setShowOnboarding(false);
  setAudioMode(chosenAudioMode);
  if (chosenAudioMode && vcSupported) {
    setTimeout(() => vcStart(), 1500); // Auto-start voice commands
  }
};

// Dans le JSX
{
  showOnboarding && <AudioOnboarding onComplete={handleOnboardingComplete} />;
}
```

## Animations Tailwind

Ajoutées dans `web/tailwind.config.js` :

```javascript
animation: {
  fadeIn: "fadeIn 0.5s ease-out",
  slideUp: "slideUp 0.6s ease-out",
  pulseRing: "pulseRing 2s ease-out infinite",
  float: "float 6s ease-in-out infinite",
},
keyframes: {
  fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
  slideUp: { "0%": { opacity: "0", transform: "translateY(30px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
  pulseRing: { "0%": { transform: "scale(1)", opacity: "0.6" }, "100%": { transform: "scale(2.5)", opacity: "0" } },
  float: { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
},
```
