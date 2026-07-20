# Pack audio

Le client lit `/audio/manifest.json` au démarrage. Tant que ce fichier n’existe
pas, l’application reste silencieuse et le réglage sonore de la HUD est désactivé
avec la mention « aucun pack audio n’est publié pour cette instance ». Aucun son
n’est simulé et aucune fixture ne remplace un pack manquant.

**Ce manifeste est désormais publié.** Il est **généré**, pas écrit à la main :
`node scripts/build-pack-manifests.mjs` le dérive du pack livré sous
`public/packs/diapason-core/`. Six signaux sur onze sont liés ; les cinq
`ambience.*` restent délibérément absents parce que le pack déclare ne fournir
aucune boucle d’ambiance. Les lier à un son court serait inventer un contenu que
le pack annonce ne pas avoir.

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
par `canPlayType` est retenue. Prévoir Opus/Ogg puis MP3. Le pack livré n’expose
qu’une source `audio/ogg` (Vorbis) par signal : c’est ce que Kenney publie, et
aucun transcodage n’est fait — les octets restent identiques à l’archive amont,
ce qui garde la provenance vérifiable par empreinte.

## Règles

- Le son est désactivé par défaut et se règle depuis la HUD.
- Aucune information n’est portée par le son seul : chaque signal double une
  indication déjà visible.
- `prefers-reduced-motion` **ne coupe pas** le son. Voir « Réduction des
  animations » ci-dessous.
- Une version de manifeste inconnue échoue explicitement plutôt que d’être
  interprétée (invariant 14).
- Le réglage de la HUD n’est actif que si un signal au moins se résout vers un
  fichier que ce navigateur sait décoder. Voir « Disponibilité réelle ».

## Déclencheurs

Chaque signal est câblé à un évènement **déjà visible** à l’écran. La
correspondance est isolée dans
[`src/shared/audio/audio-signals.ts`](../../src/shared/audio/audio-signals.ts)
sous forme de fonctions pures, et testée : un signal débranché fait échouer la
suite au lieu de rendre le produit silencieux sans bruit.

| Signal | Déclencheur | Retour visuel doublé |
|---|---|---|
| `signature.choice` | Commande acceptée par le moteur ; choix de la démo | Scène redessinée |
| `signature.error` | Notice de ton `error` ; erreur en ligne du lecteur | `role="alert"` |
| `signature.reward` | Notice de ton `success` ; clé d’intégration obtenue | Notice, `KeyReward` |
| `signature.door` | Ouverture d’un lieu sur la carte ; consultation d’un document | `PlaceOverlay`, `DocumentView` |
| `music.ending` | Session passée à `Completed` ; fin de démo hors rupture | Épilogue et bilan |
| `music.gameOver` | Session passée à `Abandoned` ; rupture en démo | Bilan de rupture |

Les pistes longues suivent une **transition** d’état, jamais un rechargement :
revenir sur une partie terminée ne relance pas l’épilogue.

## Disponibilité réelle

Le pack livré n’expose qu’une source `audio/ogg` par signal. Safari ne la lit
pas. Le réglage de la HUD ne se fonde donc pas sur le chargement du manifeste
mais sur `AudioSource.playableCues` : la liste des signaux qui se résolvent
vraiment. Quand elle est vide, le bouton est désactivé et annonce lequel des
deux empêchements s’applique — aucun pack publié, ou aucun format lisible par ce
navigateur. Un réglage qui ne règle rien serait un mensonge de l’interface.

Livrer une seconde source MP3 par signal suffirait à lever ce cas. Ce n’est pas
fait ici : cela demanderait un transcodage, donc des octets qui ne seraient plus
ceux de l’archive amont, et la provenance vérifiable par empreinte serait
perdue.

## Ambiances absentes

Aucune des cinq `ambience.*` n’est publiée, et le pack déclare ce manque dans
`gaps[]`. Les vues qui en demandent une — accueil, carte, lecteur — obtiennent
`undefined`. Ce silence est désormais **annoncé** plutôt que subi :
`AudioProvider` expose un état `ambienceStatus`, la valeur `missing` est reprise
dans l’infobulle et le libellé accessible du réglage sonore, et une trace
`console.info` nomme le signal demandé. Aucun son court n’est substitué à une
boucle qui n’existe pas.

## Réduction des animations

`prefers-reduced-motion` ne coupe plus l’ambiance. Ce réglage exprime une
demande sur le **mouvement** — son objet est vestibulaire —, pas sur le son. Le
confondre avec une préférence sonore rendait l’application muette pour ces
personnes alors que le bouton de la HUD s’affichait actif : le produit annonçait
un son qu’il avait lui-même coupé, sans jamais le dire.

Le son dispose déjà de son propre réglage, explicite et coupé par défaut.
Activer le son est donc un acte délibéré, qu’une préférence portant sur
l’animation n’a pas à contredire en silence. L’invariant 11 reste tenu :
`prefers-reduced-motion` continue de gouverner les animations visuelles.
