# Roadmap

## Jalon 0 — fondation Web

Next.js App Router, design system, routes produit, fixtures isolées et chaîne de qualité.

**Statut : terminé.**

## Jalon 1 — catalogue connecté

Chargement du catalogue public Authoring dans l’accueil et la bibliothèque, avec état d’indisponibilité explicite.

**Statut : terminé.**

## Jalon 2 — parcours narratif complet

Identity, atelier Authoring, session Play, interactions typées, pause/reprise et arbre explicable.

**Statut : terminé.**

## Jalon 3 — conteneur de production

Build Next.js standalone, image multi-stage durcie, Compose et validation CI.

**Statut : terminé.**

## Jalon 4 — première expérience produit

Exposer Configuration, RBAC custom et scoped, Entra ID, le familier, l’économie, le magasin et la génération contextualisée, avec séparation stricte du Studio et de l’Administration.

**Statut : terminé.**

## Jalon 4.1 — vocabulaire du jeu

Dictionnaire extensible de copies publié par le moteur, éditeur de libellés dans l’Administration et consommation dans la navigation, l’accueil, la bibliothèque, le Studio et l’espace joueur.

**Statut : terminé.**

## Jalon 5 — structures et exploitation avancées

Memberships et encadrants dans les unités école/classes ou entreprise/équipes, périodes métier, import CSV prévalidé et affectations scénario/catégorie/parcours résolues sont livrés. La carte filtre le catalogue des membres selon ces affectations. Restent l'export et les autres opérations en masse, le reporting collectif, les workflows éditoriaux collaboratifs et la configuration économique avancée.

**Statut : en cours.**

## Jalon 4.3 — expérience joueur immersive

Introduction publique versionnée, page compte explicite, bootstrap moteur, tutoriel persistant, carte et recherche, journal personnel, maîtrise cross-session, compagnon illustré/personnalisable, magasin, centre d'aide et déconnexion.

**Statut : implémenté sur `feat/immersive-player-experience`.** Typecheck, lint, tests et build production sont validés.

## Jalon 4.4 — seuil narratif et monde illustré

Introduction rejouable depuis la connexion, démo sous l’authentification, création finalisable du familier, packs visuels sans propriété, tutoriel présenté comme un scénario, interactions d’écran, clé universelle, carte à portes et bilan de fin sans boucle automatique.

**Statut : implémenté sur `codex/immersive-onboarding-ux`.** Les contrats serveur restent autoritatifs ; le client ne déduit aucune transition narrative.

La passe corrective `codex/fix-player-experience-polish` remplace le retour textuel par une fermeture compacte, fiabilise l’édition du compagnon, francise les valeurs techniques, déduplique les projections du journal et ancre les portes aux lieux dessinés malgré `background-size: cover`.

## Jalon 4.2 — opérations produit et Studio low-code

Console utilisateurs avec recherche, activation et suppression logique ; suppression des rôles custom ; parcours et catégories avec rattachement des scénarios ; assets du familier ; progression par catégorie ; bibliothèque de brouillons recherchable et Studio visuel éditable ; démonstration narrative portée à environ quinze minutes. Administration et outils techniques sont regroupés.

**Statut : terminé sur `feat/product-operations-ui`, en attente de revue.**

## Jalon 4.5 — carte du récit hors partie

Le graphe de quête devient consultable sans session. Play publie `GET /scenario-versions/{versionId}/tree`, la topologie d'une version publiée sans état de monde : ni `state` de nœud, ni `evaluation` de condition. Le client adapte cette structure vers l'entrée du constructeur existant, ce qui conserve une seule implémentation de disposition et une carte hors partie strictement superposable à la carte en partie. Les refus d'autorisation restent ceux du démarrage de session et sont affichés tels quels.

**Statut : implémenté sur `feat/scenario-structure-graph`.** Non exercé contre une instance Play réelle.

## Jalon 4.6 — Studio de configuration et médias

`/studio` devient la surface complète de configuration d'un jeu : identité, catégories par posture, parcours et prérequis, familier, libellés, plan média par lieu et scénarios. Chaque section est doublée d'un aperçu rendu depuis l'état en cours, pour qu'un réglage se voie ou s'entende avant d'être publié. Un média s'assigne par référence de pack `packId:assetId` ou par URL HTTPS, et s'écoute ou s'affiche dans le champ même.

**Statut : implémenté sur `feat/studio-configuration-media`.** Deux capacités restent conditionnées au moteur et sont annoncées absentes plutôt que simulées : le bloc `media` du plan de configuration, et les champs média du schéma narratif (`422 invalid_json` vérifié sur une instance réelle).
