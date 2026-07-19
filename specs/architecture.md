# Architecture

## Décision

GenEngine Web est un client Next.js autonome. Les composants navigateur présentent les projections calculées par GenEngine. Les route handlers serveur forment une façade technique pour les cookies et appels HTTP ; ils ne constituent pas un service métier et n’embarquent pas le moteur narratif.

```mermaid
flowchart LR
    BROWSER["Browser UI"] --> ROUTES["Next.js App Router"]
    ROUTES --> API["shared/api"]
    API --> AUTHORING["Authoring API"]
    API --> PLAY["Play API"]
    API --> IDENTITY["Identity API"]
    BROWSER --> DEMO["shared/mocks<br/>démo isolée"]
```

## Frontières

- `src/app` possède les routes, handlers et la composition.
- `src/features` porte les capacités utilisateur verticales.
- `src/entities` contient les types et représentations côté client.
- `src/shared/api` possède les échanges réseau et adaptations de contrats.
- `src/shared/mocks` possède exclusivement les fixtures hors ligne.
- `src/shared/ui` contient les composants transverses sans logique métier.
- `src/shared/audio` porte le contrat sonore, la résolution des signaux et le
  fournisseur React. C'est un bloc technique : il ne décide d'aucune règle de jeu
  et reste neutre tant qu'aucun manifeste n'est publié.

Une feature ne dépend pas directement d’une autre. Les règles narratives, validations d’histoires et calculs de transition appartiennent au backend.

## Coque immersive

L'application occupe le viewport : `body` mesure `100dvh` et ne défile pas, `main`
porte le défilement, et toute navigation est une surcouche HUD posée sur la scène.
Il n'existe pas de bandeau de page ; l'en-tête est une pastille flottante qui
devient une barre basse sous 900 px, la scène passant alors en premier. L'échelle
`z` est déclarée en variables dans `globals.css` : décor `-1`, contenu `1`,
HUD `30`, panneau `40`, plein écran `90`, dialogue `180`.

## Sécurité

Les URLs de services restent côté serveur. Identity fournit le JWT conservé dans un cookie `HttpOnly`. Les permissions sont appliquées par le service propriétaire ; l’interface peut adapter sa présentation mais ne devient jamais la frontière d’autorisation.

## Déploiement

Next.js produit une sortie `standalone` dans une image multi-stage. Le runtime s’exécute sans privilèges, avec un filesystem en lecture seule et des espaces temporaires bornés. Compose expose le client sur `3001` pour cohabiter avec Grafana sur `3000`.
