# GenEngine.Web

Interface Web de GenEngine : une expérience narrative premium pour découvrir, jouer et créer des récits interactifs.

> **État :** client connecté au catalogue, à Identity et au parcours Play complet, avec une démo visuelle isolée. Aucun moteur narratif n'est exécuté dans le navigateur.

## Parcours disponibles

| Route | Intention |
| --- | --- |
| `/` | Découverte éditoriale et sélection de récits |
| `/library` | Bibliothèque et reprise de lecture |
| `/play/demo` | Player interactif de démonstration hors ligne |
| `/play/[versionId]` | Session moteur : narration, choix, quiz, texte libre, pause et arbre explicable |
| `/studio` | Atelier Authoring : import, révision, validation, analyse, prévisualisation et publication |

## Stack

- Next.js App Router, React et TypeScript strict
- Tailwind CSS v4 et design tokens CSS
- Vitest pour les tests unitaires
- ESLint avec les règles Next.js Core Web Vitals
- GitHub Actions pour lint, types, tests et build

## Démarrage

Prérequis : Node.js 22+ et pnpm 10.28+.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Architecture

```text
src/
├── app/                  # Routes, layouts et composition
├── entities/             # Types et représentations métier côté client
├── features/             # Capacités utilisateur verticales
└── shared/
    ├── api/              # Frontière HTTP, futur client OpenAPI généré
    ├── lib/              # Utilitaires sans dépendance UI
    ├── mocks/            # Fixtures de démonstration explicitement isolées
    └── ui/               # Composants transverses du langage visuel
```

Les règles narratives, la validation des histoires et le calcul des transitions appartiennent au backend GenEngine. Le Web affiche les états reçus et envoie les intentions de l'utilisateur. Le changement de scène du player actuel est uniquement une interaction de fixture destinée à valider l'interface.

## Connexion au backend

Les routes serveur Next.js jouent le rôle de façade vers les trois services. Configurez les URL internes dans `.env.local` :

```dotenv
GENENGINE_AUTHORING_URL=http://localhost:5201
GENENGINE_PLAY_URL=http://localhost:5202
GENENGINE_IDENTITY_URL=http://localhost:5203
```

Ces variables restent côté serveur. Le JWT est conservé dans un cookie `HttpOnly`, tandis que le navigateur ne stocke que l'identifiant opaque de la dernière session par version publiée. Si Authoring est indisponible, la bibliothèque signale explicitement le mode démonstration. Les points d'entrée techniques sont sous `src/shared/api`.

Le player connecté consomme les statuts et transitions calculés par Play : choix legacy et typés, narration, quiz, texte libre avec confirmation, pause/reprise et arbre de session avec explication des conditions. Il ne réimplémente aucune règle Narrative.

À la stabilisation définitive des contrats :

1. générer le client TypeScript depuis l'OpenAPI du backend ;
2. implémenter un adaptateur de données par environnement ;
3. conserver les fixtures pour Storybook, les tests et le développement hors ligne ;
4. ne jamais recopier les règles de `GenEngine.Narrative` dans ce dépôt.

## Direction visuelle

- midnight/ink pour la profondeur ;
- ember/amber pour les décisions et appels à l'action ;
- verdigris pour les états positifs et l'exploration ;
- ivory pour la lecture longue ;
- serif éditoriale pour la narration, sans-serif système pour l'interface ;
- mouvement discret, avec respect de `prefers-reduced-motion`.

Le langage visuel peut être décliné sur iOS via des tokens et principes partagés. Les deux clients conservent leurs composants natifs et leurs propres dépôts.

## Sécurité et configuration

- Ne jamais committer `.env.local` ni de secrets.
- Seules les variables préfixées `NEXT_PUBLIC_` sont exposées au navigateur.
- Le dépôt est public : toute donnée de démonstration doit être fictive.

## Dépôts associés

- [GenEngine backend](https://github.com/JordanLacroix/GenEngine)
- [GenEngine iOS](https://github.com/JordanLacroix/GenEngine.IOS)
