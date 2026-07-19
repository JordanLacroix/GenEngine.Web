# Pack d’assets

Le Studio lit `/packs/manifest.json` au chargement. Tant que ce fichier n’existe
pas, le catalogue est **absent** — pas vide : les sélecteurs d’assets ne
proposent aucune liste, l’interface affiche « aucun pack d’assets n’est publié
sur cette instance : seules les URLs HTTPS sont assignables », et aucune
référence `packId:assetId` ne peut être résolue. Aucun catalogue n’est simulé.

Le contrat est défini dans
[`src/shared/assets/asset-pack.ts`](../../src/shared/assets/asset-pack.ts). Une
version de manifeste inconnue échoue explicitement au lieu d’être interprétée
(invariant 14).

```json
{
  "version": 1,
  "packId": "diapason",
  "name": "Diapason CC0",
  "license": "CC0-1.0",
  "attribution": "Kenney.nl",
  "assets": [
    {
      "id": "ui-choice-confirm",
      "kind": "audio",
      "role": "ui.click",
      "path": "/packs/diapason/ui-choice-confirm.ogg",
      "sha256": "…",
      "mimeType": "audio/ogg",
      "durationSeconds": 0.4
    },
    {
      "id": "hall-of-tuning",
      "kind": "image",
      "role": "background",
      "path": "/packs/diapason/hall.png",
      "sha256": "…",
      "width": 1920,
      "height": 1080
    }
  ],
  "gaps": [
    { "role": "ambience", "reason": "Le pack ne fournit aucune boucle d’ambiance." },
    { "role": "music", "reason": "Aucune musique réelle, seulement des signatures courtes." }
  ]
}
```

## Champs

| Champ | Rôle |
| --- | --- |
| `version` | Version du contrat. Seule la version `1` est lue. |
| `packId` | Préfixe des références `packId:assetId`. Une référence dont le préfixe ne correspond pas au manifeste chargé n’est pas résolue. |
| `assets[].kind` | `image` ou `audio`. Le sélecteur ne propose que le type attendu par le champ. |
| `assets[].role` | Rôle éditorial déclaré par le pack, affiché à côté de l’identifiant. |
| `assets[].path` | Chemin servi par l’instance ou URL absolue. |
| `gaps[]` | Ce que le pack **déclare ne pas fournir**. Affiché tel quel dans le Studio : un manque annoncé vaut mieux qu’un silence. |

## Assignation

Un champ média accepte exactement deux formes, celles que le moteur accepte :

- une URL **HTTPS absolue** ;
- une référence **`packId:assetId`**.

Toute autre valeur est signalée comme probablement refusée par le moteur, mais
reste transmise telle quelle : le serveur est seul juge.
