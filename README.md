<div align="center">

# GenEngine Web

**Client Next.js accessible pour découvrir, jouer et créer des récits interactifs GenEngine.**

[![CI](https://github.com/JordanLacroix/GenEngine.Web/actions/workflows/ci.yml/badge.svg)](https://github.com/JordanLacroix/GenEngine.Web/actions/workflows/ci.yml)
[![Node.js 22](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](#docker)
[![Status](https://img.shields.io/badge/statut-client%20connecté-2EA44F)](#état-du-projet)
[![License](https://img.shields.io/badge/licence-non%20définie-lightgrey)](#licence)

[Vision](#vision) · [Démarrage rapide](#démarrage-rapide) · [Docker](#docker) · [Architecture](#architecture) · [Roadmap](#roadmap) · [Documentation](#documentation) · [Contribuer](#contribuer)

</div>

---

## Vision

GenEngine Web fournit une expérience narrative moderne, accessible et adaptable. Le serveur reste l’autorité sur les scénarios, les sessions et les transitions ; le client présente les états reçus et transmet les intentions de l’utilisateur.

Le dépôt conserve deux parcours explicitement séparés :

- un mode connecté couvrant Identity, le catalogue Authoring et le parcours Play complet ;
- une démonstration hors ligne stable, destinée à la revue produit et aux tests d’interface.

## État du projet

| Capacité | État |
|---|---|
| Accueil et bibliothèque éditoriale | ✅ Disponible |
| Démonstration hors ligne | ✅ Disponible |
| Authentification avec cookie `HttpOnly` | ✅ Connectée |
| Catalogue public Authoring | ✅ Connecté |
| Choix, quiz et texte libre confirmé | ✅ Connectés à Play |
| Pause, reprise et arbre explicable | ✅ Connectés à Play |
| Atelier d’import et publication | ✅ Connecté à Authoring |
| Image de production et Compose | ✅ Disponibles |
| Navigation pilotée par permissions effectives | ✅ Connectée à Identity |
| Administration jeu, RBAC, Foundry, Entra et économie | ✅ Connectée et séparée du Studio |
| Génération de scénarios contextualisée | ✅ Offline et Azure AI Foundry |
| Familier, portefeuille et magasin | ✅ Connectés à PlayerExperience |

## Parcours disponibles

| Route | Intention |
|---|---|
| `/` | Découverte éditoriale et sélection de récits |
| `/library` | Bibliothèque et reprise de lecture |
| `/play/demo` | Player interactif de démonstration hors ligne |
| `/play/[versionId]` | Session moteur : interactions, pause et arbre explicable |
| `/studio` | Import, validation, analyse, prévisualisation et publication |
| `/experience` | Familier personnel, portefeuille, historique et magasin |
| `/administration` | Configuration plateforme et RBAC, distincts du Studio |

## Démarrage rapide

### Prérequis

- Node.js 22 ou version ultérieure ;
- pnpm 10.28 ou version ultérieure.

### Lancer en développement

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Docker

Construire et lancer le client en mode production :

```bash
docker compose up --build --detach --wait
```

Le conteneur est disponible sur [http://localhost:3001](http://localhost:3001). Ce port évite le conflit avec Grafana, exposé sur `localhost:3000` par la surcouche d’observabilité du backend.

Le conteneur utilise un utilisateur non-root, un système de fichiers en lecture seule, des espaces temporaires bornés et un healthcheck HTTP. Par défaut, les trois API sont recherchées sur l’hôte Docker :

| Service | URL depuis le conteneur |
|---|---|
| Authoring | `http://host.docker.internal:5201` |
| Play | `http://host.docker.internal:5202` |
| Identity | `http://host.docker.internal:5203` |
| Configuration | `http://host.docker.internal:5204` |
| PlayerExperience | `http://host.docker.internal:5205` |

Les variables `GENENGINE_AUTHORING_URL`, `GENENGINE_PLAY_URL`, `GENENGINE_IDENTITY_URL` et `GENENGINE_WEB_PORT` permettent de remplacer ces valeurs au lancement.

```bash
docker compose down
```

## Connexion au backend

Les routes serveur Next.js forment une façade vers les trois services. Configurez les URLs internes dans `.env.local` :

```dotenv
GENENGINE_AUTHORING_URL=http://localhost:5201
GENENGINE_PLAY_URL=http://localhost:5202
GENENGINE_IDENTITY_URL=http://localhost:5203
GENENGINE_CONFIGURATION_URL=http://localhost:5204
GENENGINE_PLAYER_EXPERIENCE_URL=http://localhost:5205
ENTRA_CLIENT_SECRET=
```

Ces variables restent côté serveur. Le JWT est conservé dans un cookie `HttpOnly`, tandis que le navigateur ne stocke que l’identifiant opaque de la dernière session par version publiée. Si Authoring est indisponible, la bibliothèque signale explicitement le mode démonstration.

Le player consomme les statuts et transitions calculés par Play : choix legacy et typés, narration, quiz, texte libre avec confirmation, pause/reprise et arbre de session. Il ne réimplémente aucune règle Narrative.

## Architecture

```text
src/
├── app/                  # Routes, handlers serveur et composition
├── entities/             # Types et représentations côté client
├── features/             # Capacités utilisateur verticales
└── shared/
    ├── api/              # Frontière HTTP et contrats
    ├── lib/              # Utilitaires sans dépendance UI
    ├── mocks/            # Fixtures de démonstration isolées
    └── ui/               # Composants transverses
```

Une feature ne dépend pas directement d’une autre. La composition vit dans `app`, les échanges réseau dans `shared/api` et les fixtures dans `shared/mocks`. Voir [`specs/architecture.md`](specs/architecture.md).

## Qualité

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose config --quiet
docker build --tag genengine-web:local .
```

La CI exécute ces contrôles à chaque pull request et sur `main`.

## Roadmap

Le client a livré sa fondation visuelle, la connexion au parcours narratif actuel et son conteneur de production. Les prochaines tranches suivront les contrats publiés du backend, sans anticiper les règles de configuration, d’autorisation ou d’organisation. Voir [`specs/roadmap.md`](specs/roadmap.md).

## Documentation

- [Index des spécifications](specs/README.md)
- [Passage de relais](specs/handoff.md)
- [Invariants](specs/invariants.md)
- [Architecture](specs/architecture.md)
- [Roadmap](specs/roadmap.md)
- [Guide de contribution](CONTRIBUTING.md)
- [Politique de sécurité](SECURITY.md)

## Sécurité

Ne publiez aucune vulnérabilité exploitable dans une issue. Consultez [`SECURITY.md`](SECURITY.md) pour le canal de signalement privé et le périmètre pris en charge.

## Contribuer

Les contributions suivent des branches courtes, des commits conventionnels, une PR focalisée et les contrôles CI requis. Consultez [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Dépôts associés

- [GenEngine backend](https://github.com/JordanLacroix/GenEngine)
- [GenEngine iOS](https://github.com/JordanLacroix/GenEngine.IOS)

## Licence

Aucune licence n’est actuellement définie. Le dépôt est public, mais cela n’accorde pas automatiquement un droit de réutilisation, modification ou redistribution.
