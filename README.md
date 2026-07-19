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
| Introduction, connexion/déconnexion et mode démo | ✅ Flux explicite et configurable |
| Bootstrap, tutoriel persistant, carte et aide | ✅ Pilotés par le moteur |
| Journal et maîtrise cross-session | ✅ Alimentés par Play et PlayerExperience |
| Intro rejouable, prologue illustré et clé universelle | ✅ Pilotés par la configuration |
| Carte illustrée à portes et interactions d’écran | ✅ Matérialisées par le client |
| Packs visuels de familier importables | ✅ Assets locaux, sans propriété |
| Bilan de fin avec chemin et gains | ✅ Démo et sessions connectées |
| Journal francisé et sans projections dupliquées | ✅ Normalisé côté présentation |
| Portes ancrées aux repères de la carte | ✅ Adaptées au ratio du viewport |
| Périodes métier et import CSV de memberships | ✅ Prévalidation, rapport d’erreurs et application idempotente |
| Affectations de parcours et catalogue filtré | ✅ Résolues côté serveur et reflétées sur la carte |
| Graphe de fin de quête et mémoire cumulée | ✅ Récit complet, mémoire de toutes les parties, démo et sessions connectées |

## Parcours disponibles

| Route | Intention |
|---|---|
| `/` | Découverte éditoriale et sélection de récits |
| `/account` | Connexion locale/Microsoft, création de compte et accès au mode démo |
| `/library` | Bibliothèque et reprise de lecture |
| `/library/[versionId]` | Mémoire cumulée d’un récit, consultable hors partie |
| `/play/demo` | Player interactif de démonstration hors ligne |
| `/play/[versionId]` | Session moteur : interactions, pause et arbre explicable |
| `/studio` | Import, validation, analyse, prévisualisation et publication |
| `/experience` | Carte, tutoriel, journal, familier, magasin, aide et compte joueur |
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

Le conteneur utilise un utilisateur non-root, un système de fichiers en lecture seule, des espaces temporaires bornés et un healthcheck HTTP. Par défaut, les API sont recherchées sur l’hôte Docker :

Les illustrations placées dans `public/` sont copiées dans l’image de production et servies par le runtime standalone.

| Service | URL depuis le conteneur |
|---|---|
| Authoring | `http://host.docker.internal:5201` |
| Play | `http://host.docker.internal:5202` |
| Identity | `http://host.docker.internal:5203` |
| Configuration | `http://host.docker.internal:5204` |
| PlayerExperience | `http://host.docker.internal:5205` |
| Organization | `http://host.docker.internal:5206` |

Les variables `GENENGINE_AUTHORING_URL`, `GENENGINE_PLAY_URL`, `GENENGINE_IDENTITY_URL` et `GENENGINE_WEB_PORT` permettent de remplacer ces valeurs au lancement.

```bash
docker compose down
```

## Connexion au backend

Les routes serveur Next.js forment une façade vers les services. Configurez les URLs internes dans `.env.local` :

```dotenv
GENENGINE_AUTHORING_URL=http://localhost:5201
GENENGINE_PLAY_URL=http://localhost:5202
GENENGINE_IDENTITY_URL=http://localhost:5203
GENENGINE_CONFIGURATION_URL=http://localhost:5204
GENENGINE_PLAYER_EXPERIENCE_URL=http://localhost:5205
GENENGINE_ORGANIZATION_URL=http://localhost:5206
ENTRA_CLIENT_SECRET=
```

Ces variables restent côté serveur. Le JWT est conservé dans un cookie `HttpOnly`, tandis que le navigateur ne stocke que l’identifiant opaque de la dernière session par version publiée. Si Authoring est indisponible, la bibliothèque signale explicitement le mode démonstration.

Le player consomme les statuts et transitions calculés par Play : choix legacy et typés, narration, quiz, texte libre avec confirmation, pause/reprise et arbre de session. Il ne réimplémente aucune règle Narrative.

### Packs visuels de familier

L’espace Compagnon accepte un manifeste JSON de schéma `1`. Il déclare un portrait HTTPS ou un asset local sous `/illustrations/`, ainsi qu’une licence et une attribution. Le pack ne modifie que la présentation locale : il ne crée ni propriété, ni achat, ni progression. La sélection du familier reste enregistrée par PlayerExperience.

Le configurateur conserve les valeurs contractuelles lors de l’enregistrement, mais présente leurs libellés en français. Son action d’enregistrement reste accessible pendant le défilement et confirme la projection relue depuis le serveur.

Un exemple est disponible dans [`public/familiar-packs/aster.json`](public/familiar-packs/aster.json).

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

Le client livre le parcours narratif, son conteneur de production et la plateforme configurable. La tranche immersive couvre introduction, compte, onboarding persistant, carte plein écran, HUD superposée, portes positionnées dans le monde, recherche, journal, maîtrise, familier illustré et aide. Hors des écrans de connexion, l’expérience joueur n’utilise pas la navigation de la plateforme : les fonctions deviennent des overlays du jeu. L’Administration sépare désormais la configuration éditoriale des opérations : périodes, unités, participants, encadrants, import CSV prévalidé et affectations de scénarios/catégories/parcours. La carte connectée ne présente à un membre que les catégories couvertes par ses affectations effectives. La fin de quête affiche désormais le graphe complet du récit, pas seulement le chemin emprunté, avec la mémoire cumulée de toutes les parties précédentes. Voir [`specs/roadmap.md`](specs/roadmap.md).

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
