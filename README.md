<div align="center">

# GenEngine Web

**Client Next.js accessible pour découvrir, jouer et créer des récits interactifs GenEngine.**

[![CI](https://github.com/JordanLacroix/GenEngine.Web/actions/workflows/ci.yml/badge.svg)](https://github.com/JordanLacroix/GenEngine.Web/actions/workflows/ci.yml)
[![Node.js 22](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](#docker)
[![Status](https://img.shields.io/badge/statut-client%20connecté-2EA44F)](#état-du-projet)
[![License](https://img.shields.io/badge/licence-non%20définie-lightgrey)](#licence)

[Vision](#vision) · [Démarrage rapide](#démarrage-rapide) · [Docker](#docker) · [Architecture](#architecture) · [Limites connues](#limites-connues) · [Roadmap](#roadmap) · [Documentation](#documentation) · [Contribuer](#contribuer)

</div>

---

## Vision

### Ce que c’est

GenEngine est un **moteur narratif entièrement paramétrable**, vendu avec son
interface de configuration — le **Studio**. Ce dépôt en est le client Web.

### Pour qui

Les **écoles d’ingénieurs**, les **entreprises** et les **organismes de formation
professionnelle**. Un client achète le moteur et compose son propre jeu depuis le
Studio, sans écrire de code : identité, catégories, parcours, prérequis,
compagnon, vocabulaire, médias et scénarios.

### La configuration de référence

**« Le Diapason »** est la configuration jouée à la première initialisation, et
industrialisable par instance client. 2026, notre monde, les systèmes génératifs
partout, le joueur en alternance dans une école d’ingénieurs. Six **postures** —
Lucidité, Discernement, Arbitrage, Courage, Transmission, Autonomie — remplacent
les catégories par matière, pour dix scénarios.

### Comment ça tourne

Le serveur reste l’autorité sur les scénarios, les sessions, les transitions et
les permissions ; le client présente les états reçus et transmet les intentions de
l’utilisateur. Voir [Démarrage rapide](#démarrage-rapide) pour lancer le client, et
[Connexion au backend](#connexion-au-backend) pour le raccorder aux six services.

L’application est immersive : elle occupe le viewport, ne borde jamais la scène d’un bandeau de page, et fait de toute navigation une surcouche HUD. Sous 900 px la scène passe en premier et la navigation devient une barre basse.

Le dépôt conserve deux parcours explicitement séparés :

- un mode connecté couvrant Identity, le catalogue Authoring et le parcours Play complet ;
- une démonstration hors ligne stable, destinée à la revue produit et aux tests d’interface.

### La démonstration hors ligne

`/play/demo` échantillonne la configuration de référence « Le Diapason » telle
qu’elle est décrite dans la bible d’univers du dépôt `GenEngine`
(`specs/domain/diapason`). Elle ne raconte pas une histoire mais **trois
situations**, pour montrer l’étendue des usages qu’une école ou une entreprise
achète. Un nœud d’accueil laisse le visiteur choisir :

| Situation | Posture | Usage démontré |
|---|---|---|
| La note de service | Lucidité | établir la provenance d’un document que personne ne revendique |
| La réunion où personne ne doute | Courage | conflit professionnel : objecter au bon moment, dans la bonne forme |
| La spécification avant le code | Transmission | apprentissage d’une matière — Spec Driven Development |

La fixture compte **23 scènes** et **12 fins**, et chaque situation se termine en
quelques minutes. Les fins reprennent la convention de nommage du contenu
canonique : `fin-accord-*` (3) lorsque la posture est tenue et comprise,
`fin-partielle-*` (3) lorsque le résultat est bon mais le raisonnement non
consolidé, `fin-rupture-*` (6) lorsque la situation ne peut plus être rattrapée.
Chaque situation mène à deux ruptures.

Le moteur n’expose aucun drapeau de type « game over » : une rupture est portée
par le texte et par l’interface, qui **désactive** le retour arrière — sans le
retirer — et fait de « Reprendre depuis le début » l’action principale. La
distinction entre les trois natures de fin est un champ `outcome` **local à la
démonstration**, pas un contrat serveur.

La fixture vit dans `src/shared/mocks` et ne dépend d’aucun appel réseau. Elle
n’est jamais servie à la place d’une erreur distante, et la démonstration reste
inaccessible dès qu’une session existe.

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
| Portes ancrées aux repères de la carte | ✅ Adaptées au ratio du viewport, une ancre par posture, décalage en spirale au-delà des six clairières dessinées |
| Périodes métier et import CSV de memberships | ✅ Prévalidation, rapport d’erreurs et application idempotente |
| Affectations de parcours et catalogue filtré | ✅ Résolues côté serveur et reflétées sur la carte |
| Graphe de fin de quête et mémoire cumulée | ✅ Récit complet, mémoire de toutes les parties, démo et sessions connectées |
| Carte du récit hors partie | ✅ Structure publiée lue sur Play, colorée par la maîtrise cumulée |
| Studio de configuration du jeu | ✅ Jeu, catégories, parcours, prérequis, familier et libellés, avec aperçu par section |
| Plan média par lieu et fin de partie | ✅ Le bloc `media` du plan de configuration est publié et consommé au runtime |
| Médias de scène, de choix et repères d’animation | ⚠️ Édités et prévisualisés ; refusés à l’enregistrement par un moteur sans schéma média (`422 invalid_json`) |
| Catalogue d’assets `packId:assetId` | ✅ Pack `diapason-core` livré : 62 assets CC0, manifeste vérifié par empreinte |
| Ambiances, musiques et illustrations Diapason | ❌ Absentes du pack CC0 — voir [Limites connues](#limites-connues) |
| Game over de première classe | ❌ Le moteur n’expose aucun drapeau d’échec ; l’échec est narratif seulement |
| Rotation quotidienne | ❌ Décrite dans la bible d’univers du dépôt `GenEngine`, non implémentée ici |

## Parcours disponibles

| Route | Intention |
|---|---|
| `/` | **Seuil de connexion** : formulaire local/Microsoft, bouton de démonstration sous le formulaire — redirige vers `/experience` si une session existe |
| `/plateforme` | Ouverture d’univers puis promesse plateforme, pour une personne qui décide |
| `/parametres` | URLs des six services, en mode groupé ou unitaire, avec test de joignabilité — **accessible sans session** |
| `/account` | Redirection permanente vers `/`, pour les liens déjà distribués |
| `/library` | Bibliothèque et reprise de lecture |
| `/library/[versionId]` | Carte complète du récit et mémoire cumulée, sans session ouverte |
| `/play/demo` | Démonstration hors ligne « Le Diapason », trois situations au choix, réservée aux visiteurs anonymes — redirige vers `/experience` si une session existe |
| `/play/[versionId]` | Session moteur : interactions, pause et arbre explicable |
| `/studio` | Configuration du jeu : identité, catégories et parcours, familier, libellés, médias, scénarios — chaque section avec son aperçu |
| `/experience` | Carte, tutoriel, journal, familier, magasin, aide et compte joueur |
| `/administration` | Configuration plateforme et RBAC, distincts du Studio |

## Studio

`/studio` est la surface où un client configure son propre jeu, sans toucher au
code. Six sections, chacune doublée d'un aperçu de ce que le réglage produit :

| Section | Ce qui se configure | Aperçu |
|---|---|---|
| Le jeu | Nom, description, histoire globale, langue, fuseau, organisation | Ouverture, avec le fond configuré pour l'accueil |
| Catégories & parcours | Catégories par posture, accents, visibilité, scénarios rattachés, parcours et prérequis | Carte : une porte par catégorie visible |
| Familier | Nom, forme, ton, style, accent, niveau d'aide, portrait, licence | Silhouette, aura et réplique d'exemple recomposée |
| Libellés | Vocabulaire du jeu, clé par clé | Navigation et Studio rendus avec les libellés |
| Médias | Ambiance, musique, fond, tempo et boucle par lieu, plus la fin de partie | Le lieu avec son fond, écoute directe des sons |
| Scénarios | Scènes, choix, destinations, visuels, sons et repères d'animation | Scène jouable : le visuel, le texte, et l'interaction déclenchée au clic |

Le document de configuration reste celui du plan de contrôle : le Studio le lit,
le modifie et le renvoie tel quel, en conservant les champs qu'il ne connaît pas.
**Enregistrer** écrit le brouillon, **Publier** publie une version.

### Assigner un média

Un champ média accepte une URL HTTPS absolue ou une référence `packId:assetId`
résolue par [`/packs/manifest.json`](public/packs/README.md). Un son s'écoute et
un visuel s'affiche directement dans le champ. Une référence non résolue le dit
et reste transmise telle quelle : le serveur est seul juge.

### Ce qui dépend d'une tranche moteur

Une capacité reste posée côté client mais conditionnée au moteur déployé, et
l'interface l'annonce au lieu de le simuler :

- **Médias de scène et de choix** — `visualUrl`, `visualDescription`, `soundUrl`
  et `animationCue` sont écrits dans le document narratif. Un moteur sans schéma
  média refuse l'enregistrement (`422 invalid_json`) ; le Studio nomme cette
  cause probable au lieu de laisser « JSON invalide » seul.

Le **plan média par lieu** ne l'est plus : le bloc `media` du plan de
configuration est publié et consommé au runtime. La section reste défensive — si
une instance ne le publiait pas, elle expliquerait ce qui manque, n'afficherait
aucun formulaire, et laisserait malgré tout auditionner le pack.

### Repères d'animation

Un repère est une chaîne libre transmise au moteur. Le client sait en jouer
cinq — `pulse`, `shake`, `glow`, `rise`, `fade` — et le dit quand il n'en connaît
pas un plutôt que d'animer au hasard. L'aperçu nomme toujours en toutes lettres
le choix, sa destination, le son joué et l'animation : l'information n'est jamais
portée par la seule animation, et le mouvement est neutralisé sous
`prefers-reduced-motion`.

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

Les six variables `GENENGINE_*_URL` du tableau ci-dessus, ainsi que
`GENENGINE_WEB_PORT`, permettent de remplacer ces valeurs au lancement. Les noms
exacts sont ceux de [`.env.example`](.env.example) et de
[`compose.yaml`](compose.yaml) : `GENENGINE_AUTHORING_URL`, `GENENGINE_PLAY_URL`,
`GENENGINE_IDENTITY_URL`, `GENENGINE_CONFIGURATION_URL`,
`GENENGINE_PLAYER_EXPERIENCE_URL` et `GENENGINE_ORGANIZATION_URL`.

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
GENENGINE_ALLOW_ENDPOINT_OVERRIDE=
GENENGINE_ENDPOINT_ALLOWED_HOSTS=
```

Ces variables restent côté serveur. Le JWT est conservé dans un cookie `HttpOnly`, tandis que le navigateur ne stocke que l’identifiant opaque de la dernière session par version publiée. Si Authoring est indisponible, la bibliothèque signale explicitement le mode démonstration.

Le player consomme les statuts et transitions calculés par Play : choix legacy et typés, narration, quiz, texte libre avec confirmation, pause/reprise et arbre de session. Il ne réimplémente aucune règle Narrative.

### Configurer les URLs depuis le navigateur

`/parametres` permet de régler les six adresses **sans être connecté** — c’est
précisément ce qu’on fait avant de pouvoir s’authentifier. Deux modes : un hôte
commun avec un port par service, ou une URL complète et indépendante par service
pour un déploiement réparti sur plusieurs machines.

Ce que l’écran fait réellement, parce qu’un écran qui enregistre sans effet vaut
moins que pas d’écran :

- l’enregistrement pose un cookie `HttpOnly`, `SameSite=Strict`, via
  `PUT /api/settings/endpoints` ; le navigateur ne lit jamais sa valeur ;
- `resolveServiceUrl()` relit ce cookie **à chaque requête serveur**, avant
  `fetch`. Les appels partent donc bien vers l’adresse saisie ;
- la portée est **ce navigateur uniquement**. L’environnement du serveur reste
  le défaut de l’instance et n’est pas modifié ;
- aucune variable `NEXT_PUBLIC_` n’est créée : l’invariant 9 tient, la
  résolution reste serveur ;
- `POST /api/settings/endpoints/test` teste un service depuis le serveur. Un
  `404` compte comme joignable et le dit : le test prouve qu’un serveur HTTP
  répond, pas qu’il s’agit du bon service.

`GENENGINE_ENDPOINT_ALLOWED_HOSTS` borne les hôtes que le serveur accepte de
viser, en liste séparée par des virgules. **Défaut : `localhost`, `127.0.0.1`,
`::1`, `host.docker.internal`** — la convention de déploiement local. Sans cette
barrière, l’écran ferait du serveur un relais vers tout ce qu’il peut joindre et
pas le visiteur : contournement de frontière réseau et scanner de ports
(CWE-918). Elle s’applique à l’enregistrement, au test de joignabilité **et** à
la relecture du cookie, pour qu’un durcissement ultérieur de la liste invalide
les surcharges déjà posées. **Il n’existe aucun joker** : un exploitant qui vise
d’autres machines les nomme. Un `*` rendrait au cookie le pouvoir de désigner
l’hôte appelé, ce que cette liste retire précisément. L’écran annonce la liste
au lieu de la laisser découvrir par un refus.

La surcharge ne fournit d’ailleurs jamais la chaîne appelée : elle *sélectionne*
un hôte parmi ceux déclarés et un port entier borné, et l’URL est recomposée à
partir de ces valeurs de confiance.

**Une adresse est une origine, pas un préfixe.** Un chemin de base est refusé à
la saisie, avec un message qui le dit. Ce n’est pas une limitation arbitraire :
la façade appelle `new URL("/auth/login", base)`, et un chemin absolu remplace
celui de la base. Un préfixe saisi serait accepté, affiché, sondé avec succès —
puis absent des vrais appels. Un déploiement derrière un reverse-proxy avec
préfixe se configure côté serveur.

**Ce que l’écran affiche est ce que le serveur appelle.** La ligne « actuellement
appelée » est calculée par `resolveServiceUrl`, la fonction qui décide réellement
de l’adresse, et non par une seconde dérivation qui pourrait diverger.

**Risque assumé : la sonde est un oracle de découverte.** `/parametres` est
accessible sans session, et le test renvoie un statut et une latence. Quelqu’un
d’anonyme peut donc découvrir quels ports répondent sur les hôtes déjà autorisés.
En production le risque ne se matérialise pas : la surcharge y est désactivée par
défaut, la sonde ignore alors l’adresse proposée et ne teste que les services
déjà configurés par l’exploitant. Activer `GENENGINE_ALLOW_ENDPOINT_OVERRIDE` en
production, c’est accepter cet oracle en même temps que la capacité.

`GENENGINE_ALLOW_ENDPOINT_OVERRIDE` tranche l’autorisation. **Défaut : activé
hors production, désactivé en production**, parce qu’une surcharge acceptée en
production déplacerait la cible d’appels portant le JWT de la personne
connectée. Désactivé, l’écran reste consultable, annonce les adresses effectives
en lecture seule, laisse les tests disponibles, et `PUT` répond `403` — il
n’enregistre jamais une valeur sans effet. Les mutations exigent en outre une
requête de même origine (`Sec-Fetch-Site`).

### Son

Le client lit `/audio/manifest.json` au démarrage. Ce manifeste **est publié** :
**6 des 11 signaux** du contrat sont liés au pack `diapason-core`, et le réglage
sonore de la HUD est actif. Les **5 signaux `ambience.*` restent muets** parce que
le pack déclare ne fournir aucune boucle d’ambiance ; les deux signaux `music.*`
jouent un stinger court, faute de piste longue. Sans manifeste du tout, la source
resterait silencieuse et le réglage désactivé en affichant la raison — aucun son
n’est jamais simulé.

Le son est désactivé par défaut, ne porte jamais seul une information, et
l’ambiance continue reste coupée sous `prefers-reduced-motion`. Le contrat attendu
est décrit dans [`public/audio/README.md`](public/audio/README.md).

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
    ├── assets/           # Contrat de pack d'assets et résolution `packId:assetId`
    ├── audio/            # Contrat sonore, résolution des signaux, fournisseur React
    ├── lib/              # Utilitaires sans dépendance UI
    ├── mocks/            # Fixtures de démonstration isolées
    └── ui/               # Composants transverses
```

Une feature ne dépend pas directement d’une autre. La composition vit dans `app`, les échanges réseau dans `shared/api` et les fixtures dans `shared/mocks`. Voir [`specs/architecture.md`](specs/architecture.md).

## Limites connues

Ces manques sont assumés et annoncés, jamais simulés. Le détail et les causes
sont dans [`specs/handoff.md`](specs/handoff.md).

### Défaut réel sur `main`

Aucun défaut identifié à ce jour. Le seul connu — la sixième porte de la carte
inatteignable — a été corrigé et fusionné par [#20](https://github.com/JordanLacroix/GenEngine.Web/pull/20).

Réserve mineure qui subsiste : au-delà de six catégories publiées, une porte reste
placée mais **hors clairière dessinée**, décalée en spirale. C’est un compromis
assumé — jamais superposé, mais pas une position choisie à la main.

### Manques du pack d’assets

Le pack `diapason-core` **déclare lui-même** ces manques dans son champ `gaps[]`.
Aucune source non CC0 n’a été substituée pour les combler.

- **Aucune boucle d’ambiance ni musique longue** : le catalogue CC0 de Kenney n’en publie pas. 6 signaux sonores sur 11 sont liés ; les 5 `ambience.*` restent muets.
- **Aucune illustration peinte ni portrait de personnage** : Kenney ne publie pas de 2D compatible avec la direction artistique Diapason.

### Direction artistique

Les visuels de `public/illustrations/` relèvent de l’**heroic fantasy** — portail
elfique, îles flottantes avec phare, renard céleste — et **ne correspondent pas**
à l’univers Diapason (2026, notre monde, IA partout). Ils sont hérités d’une
itération antérieure. L’accueil n’en utilise qu’un, en fond décoratif.

### Dépendances moteur

- **Médias de scène et de choix** : `visualUrl`, `visualDescription`, `soundUrl` et `animationCue` sont édités et prévisualisés par le Studio, mais refusés à l’enregistrement (`422 invalid_json`). Dépendance du dépôt `GenEngine`.
- **Pas de game over de première classe** : le moteur ne publie que `isEnding`. L’échec est **narratif seulement** ; la distinction accord / partielle / rupture est un champ `outcome` local à la démonstration, jamais un contrat serveur.

### Non implémenté

- **Rotation quotidienne** : décrite dans la bible d’univers du dépôt `GenEngine`, absente de ce dépôt et annoncée nulle part dans l’interface.

## Qualité

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose config --quiet
docker build --tag genengine-web:local .
```

La CI exécute exactement ces sept étapes, dans cet ordre, à chaque pull request
et sur `main` — voir [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Il
n’y a **pas** de linter Markdown : la justesse de la documentation reste une
responsabilité humaine.

## Roadmap

Les jalons 0 à 4.7 sont fusionnés dans `main` : parcours narratif, conteneur de
production, plateforme configurable, coque immersive, carte du récit hors partie,
Studio de configuration en six sections et pack d’assets `diapason-core`.

Le **jalon 5** — structures et exploitation avancées — est en cours : périodes,
unités, memberships, import CSV prévalidé et affectations sont livrés ; restent
l’export en masse, le reporting collectif, les workflows éditoriaux collaboratifs
et la configuration économique avancée.

Aucune tranche n’est engagée au-delà. Les chantiers identifiés sont ceux de
[Limites connues](#limites-connues). Détail et réserves par jalon dans
[`specs/roadmap.md`](specs/roadmap.md).

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
