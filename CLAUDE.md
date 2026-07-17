# CLAUDE.md — GenEngine.Web

## Mission

Construire un client Web narratif moderne, accessible et adaptable. Le dépôt est indépendant du backend et du client iOS.

## Règles non négociables

1. Ne jamais implémenter le moteur, les conditions ou la validation Narrative dans le client.
2. Traiter le backend comme l'autorité sur l'histoire, la session et les transitions.
3. Ranger les données de démonstration uniquement dans `src/shared/mocks`.
4. Passer par `src/shared/api` pour toute intégration réseau ; préférer un client OpenAPI généré.
5. Organiser les capacités dans `src/features`, sans dossier `components` fourre-tout.
6. Préserver TypeScript strict, l'accessibilité clavier, les contrastes et `prefers-reduced-motion`.
7. Garder la direction GenEngine : ink, ivory, ember et verdigris ; aucune esthétique SaaS violette générique.
8. Partager avec iOS les contrats et principes visuels, jamais du code UI Web.

## Langue et conventions

- Discussions et documentation produit en français.
- Code, noms techniques et commits en anglais.
- Composants React en PascalCase, fonctions et fichiers utilitaires en kebab-case/camelCase selon l'existant.
- Une feature ne dépend pas directement d'une autre feature ; composer dans `app`.

## Avant chaque livraison

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Mettre à jour le README lorsqu'une route, une commande, une variable d'environnement ou une décision structurante change.

## État actuel

Les quatre routes sont une fondation visuelle sur fixtures. La prochaine intégration doit remplacer progressivement les fixtures par les contrats réels, sans casser le mode hors ligne de démonstration.
