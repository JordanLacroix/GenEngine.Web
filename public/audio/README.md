# Pack audio

Le client lit `/audio/manifest.json` au démarrage. Tant que ce fichier n’existe
pas, l’application reste silencieuse et le réglage sonore de la HUD est désactivé
avec la mention « aucun pack audio n’est publié pour cette instance ». Aucun son
n’est simulé et aucune fixture ne remplace un pack manquant.

Le contrat est défini dans [`src/shared/audio/audio-contract.ts`](../../src/shared/audio/audio-contract.ts).

```json
{
  "version": 1,
  "name": "Kenney CC0",
  "license": "CC0-1.0",
  "attribution": "Kenney.nl",
  "entries": [
    {
      "cue": "signature.choice",
      "sources": [
        { "url": "/audio/sfx/ui-choice-confirm-v1.ogg", "mimeType": "audio/ogg; codecs=\"opus\"" },
        { "url": "/audio/sfx/ui-choice-confirm-v1.mp3", "mimeType": "audio/mpeg" }
      ]
    }
  ]
}
```

## Signaux attendus

| Signal | Couche | Volume | Usage |
|---|---|---:|---|
| `ambience.home` | ambiance | 0,18 | Accueil |
| `ambience.map` | ambiance | 0,18 | Carte des passages |
| `ambience.scene` | ambiance | 0,18 | Scène narrative |
| `ambience.companion` | ambiance | 0,18 | Configuration du familier |
| `ambience.journal` | ambiance | 0,18 | Journal |
| `signature.choice` | signature | 0,46 | Choix confirmé |
| `signature.error` | signature | 0,46 | Refus ou erreur |
| `signature.reward` | signature | 0,46 | Gain, clé, fin découverte |
| `signature.door` | signature | 0,46 | Ouverture d’un lieu |
| `music.gameOver` | musique | 0,42 | Fin de partie |
| `music.ending` | musique | 0,42 | Fin de récit atteinte |

Les sources sont essayées dans l’ordre : la première dont le type MIME est accepté
par `canPlayType` est retenue. Prévoir Opus/Ogg puis MP3.

## Règles

- Le son est désactivé par défaut et se règle depuis la HUD.
- Aucune information n’est portée par le son seul : chaque signal double une
  indication déjà visible.
- L’ambiance continue reste coupée quand `prefers-reduced-motion` est demandé.
- Une version de manifeste inconnue échoue explicitement plutôt que d’être
  interprétée (invariant 14).
