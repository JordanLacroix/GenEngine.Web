# Roadmap

Les jalons ci-dessous sont ordonnés par numéro historique. Un jalon « terminé »
est **fusionné dans `main`** ; les noms de branches de développement ne sont plus
mentionnés, ils ne renseignent plus sur rien une fois la PR intégrée.

## Jalon 0 — fondation Web

Next.js App Router, design system, routes produit, fixtures isolées et chaîne de qualité.

**Statut : terminé.**

## Jalon 1 — catalogue connecté

Chargement du catalogue public Authoring dans l'accueil et la bibliothèque, avec état d'indisponibilité explicite.

**Statut : terminé.**

## Jalon 2 — parcours narratif complet

Identity, atelier Authoring, session Play, interactions typées, pause/reprise et arbre explicable.

**Statut : terminé.**

## Jalon 3 — conteneur de production

Build Next.js standalone, image multi-stage durcie, Compose et validation CI.

**Statut : terminé.**

## Jalon 4 — première expérience produit

Configuration, RBAC custom et scoped, Entra ID, familier, économie, magasin et génération contextualisée, avec séparation stricte du Studio et de l'Administration.

**Statut : terminé.**

## Jalon 4.1 — vocabulaire du jeu

Dictionnaire extensible de copies publié par le moteur, éditeur de libellés et consommation dans la navigation, l'accueil, la bibliothèque, le Studio et l'espace joueur.

**Statut : terminé.**

## Jalon 4.2 — opérations produit et Studio low-code

Console utilisateurs recherchable, cycle de vie des rôles custom, parcours et catégories avec rattachement des scénarios, assets du familier, progression par catégorie, bibliothèque de brouillons et Studio visuel éditable.

**Statut : terminé** (fusionné par #7 et #9).

## Jalon 4.3 — expérience joueur immersive

Introduction publique versionnée, page compte explicite, bootstrap moteur, tutoriel persistant, carte et recherche, journal personnel, maîtrise cross-session, compagnon personnalisable, magasin, centre d'aide et déconnexion.

**Statut : terminé** (fusionné par #8 et #11).

## Jalon 4.4 — seuil narratif et monde illustré

Introduction rejouable depuis la connexion, démo sous l'authentification, création finalisable du familier, packs visuels sans propriété, interactions d'écran, clé universelle, carte à portes et bilan de fin sans boucle automatique.

**Statut : terminé** (fusionné par #10).

Réserve : les illustrations utilisées par ce jalon relèvent d'une direction
artistique d'heroic fantasy et ne correspondent pas à la configuration de
référence « Le Diapason ». Voir [`handoff.md`](handoff.md).

## Jalon 4.5 — carte du récit hors partie

Le graphe de quête devient consultable sans session. Play publie `GET /scenario-versions/{versionId}/tree`, la topologie d'une version publiée sans état de monde : ni `state` de nœud, ni `evaluation` de condition. Le client adapte cette structure vers l'entrée du constructeur existant, ce qui conserve une seule implémentation de disposition.

**Statut : terminé** (fusionné par #13 et #14).

Réserve : les refus d'autorisation (401, `422 content_not_assigned`, 404) n'ont
jamais été exercés contre une instance Play réelle.

## Jalon 4.6 — Studio de configuration et médias

`/studio` devient la surface complète de configuration d'un jeu : identité, catégories par posture, parcours et prérequis, familier, libellés, plan média par lieu et scénarios. Chaque section est doublée d'un aperçu rendu depuis l'état en cours. Un média s'assigne par référence `packId:assetId` ou par URL HTTPS.

**Statut : terminé** (fusionné par #17).

Réserve : les **champs média du schéma narratif** — `visualUrl`,
`visualDescription`, `soundUrl`, `animationCue` — restent refusés par le moteur
(`422 invalid_json`, vérifié sur instance réelle). Le bloc `media` du plan de
configuration, lui, est publié et consommé au runtime.

## Jalon 4.7 — pack d'assets et démonstration Diapason

62 assets CC0 servis sous `public/packs/diapason-core/`, manifestes générés et vérifiés par empreinte, résolution unique par `resolveAssetReference`. La démonstration hors ligne devient un échantillon Diapason de 23 scènes et trois situations.

**Statut : terminé** (fusionné par #18 et #19).

Réserve : le pack **déclare trois manques** dans `gaps[]` — aucune boucle
d'ambiance, aucune musique longue, aucune illustration peinte. Aucune source non
CC0 n'a été substituée pour les combler.

## Jalon 5 — structures et exploitation avancées

Memberships et encadrants dans les unités école/classes ou entreprise/équipes, périodes métier, import CSV prévalidé et affectations scénario/catégorie/parcours résolues sont livrés. La carte filtre le catalogue des membres selon ces affectations.

Restent : l'export et les autres opérations en masse, le reporting collectif, les workflows éditoriaux collaboratifs et la configuration économique avancée.

**Statut : en cours.**

## Non planifié

Aucune tranche n'est engagée au-delà du jalon 5. Trois chantiers sont identifiés
et documentés dans [`handoff.md`](handoff.md) :

1. Les médias de scène et de choix — dépendance du dépôt `GenEngine`.
2. Une direction artistique servant réellement Diapason — production d'assets, pas de code.

Le placement des portes de la carte est corrigé et fusionné (#20). Il reste une
réserve mineure : au-delà de six catégories, une porte est décalée en spirale et
tombe hors clairière dessinée.

La **rotation quotidienne** est décrite dans la bible d'univers du dépôt
`GenEngine`. Elle n'est ni implémentée ni planifiée ici, et l'interface ne
l'annonce nulle part.
