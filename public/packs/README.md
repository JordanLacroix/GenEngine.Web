# Pack d’assets

Le Studio lit `/packs/manifest.json` au chargement. Tant que ce fichier n’existe
pas, le catalogue est **absent** — pas vide : les sélecteurs d’assets ne
proposent aucune liste, l’interface affiche « aucun pack d’assets n’est publié
sur cette instance : seules les URLs HTTPS sont assignables », et aucune
référence `packId:assetId` ne peut être résolue. Aucun catalogue n’est simulé.

## Ce que cette instance publie

`diapason-core`, 62 assets CC0 1.0 de Kenney, servis sous
`public/packs/diapason-core/`. Le manifeste est **généré** :

```bash
node scripts/build-pack-manifests.mjs
```

Le script traduit le manifeste amont (`asset-manifest.json`, copié depuis le
dépôt GenEngine) vers les deux contrats du client, et **recalcule chaque
empreinte SHA-256 depuis les octets copiés** : une copie corrompue échoue à la
génération. `src/shared/assets/shipped-pack.test.ts` refait ce contrôle à chaque
`pnpm test`, sur le pack réellement servi.

### Pourquoi le client héberge le pack

Le backend le sert aussi (`GET /asset-packs/{packId}/files/…` sur
`Configuration`). Le client en garde néanmoins sa copie parce que **la
démonstration doit rester jouable sans backend** : elle s’adresse à un visiteur
anonyme, et la seule origine qu’elle atteint alors est celle qui sert
l’application. Pas de CDN, pas d’hôte tiers, fonctionne hors ligne.

Les deux copies sont identiques : mêmes `id`, mêmes empreintes, vérifiées de
chaque côté par un test.

### Où la résolution a lieu

Un seul point : `resolveAssetReference` dans
[`src/shared/assets/asset-pack.ts`](../../src/shared/assets/asset-pack.ts). Le
Studio l’appelle pour ses aperçus, le runtime via
[`src/shared/assets/instance-media.ts`](../../src/shared/assets/instance-media.ts).
Un aperçu d’auteur et le rendu d’un joueur ne peuvent donc pas diverger.

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
