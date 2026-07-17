# Instructions agents — GenEngine Web

Lis ce fichier avant toute modification, puis consulte dans cet ordre :

1. [`specs/handoff.md`](specs/handoff.md) pour l’état courant et la prochaine tâche ;
2. [`specs/invariants.md`](specs/invariants.md) pour les règles non négociables ;
3. [`specs/architecture.md`](specs/architecture.md) pour les frontières du client ;
4. [`specs/roadmap.md`](specs/roadmap.md) pour les priorités ;
5. [`README.md`](README.md), [`package.json`](package.json) et [`.env.example`](.env.example) pour l’usage et la configuration.

Les contrats du backend et les invariants narratifs de référence vivent dans le dépôt [`GenEngine`](https://github.com/JordanLacroix/GenEngine). Le client ne les redéfinit pas.

## Langue et communication

- Écris les échanges utilisateur et la documentation en français.
- Garde les noms de code, messages d’erreur techniques et commits en anglais.
- Annonce toute hypothèse qui modifie le périmètre.
- Ne déclare jamais une tâche terminée avant implémentation et vérification réelles.

## Règles non négociables

- Le backend reste autoritatif sur les histoires, sessions, transitions, permissions et états narratifs.
- N’implémente aucune règle de `GenEngine.Narrative` dans le navigateur ou les routes Next.js.
- Range les fixtures uniquement dans `src/shared/mocks` ; une erreur de production ne doit jamais être remplacée silencieusement par une fixture.
- Passe par `src/shared/api` pour toute intégration réseau et préfère un client OpenAPI généré lorsque les contrats sont stabilisés.
- Organise les capacités dans `src/features` ; une feature ne dépend pas directement d’une autre et la composition reste dans `src/app`.
- Préserve TypeScript strict, l’accessibilité clavier, les contrastes et `prefers-reduced-motion`.
- Conserve la direction visuelle GenEngine : ink, ivory, ember et verdigris.

## Sécurité et configuration

- Ne committe jamais secret, token, `.env.local`, donnée personnelle ou URL interne sensible.
- Les URLs backend restent des variables serveur sans préfixe `NEXT_PUBLIC_`.
- Le JWT reste dans un cookie `HttpOnly` ; le navigateur ne conserve que des références opaques non sensibles.
- Une permission masquée dans l’interface n’est pas un contrôle d’accès ; le serveur doit toujours l’appliquer.
- Toute nouvelle configuration documente son défaut, sa portée, sa validation et son comportement désactivé.
- Préserve l’exécution du conteneur en utilisateur non-root, son système de fichiers en lecture seule et son healthcheck.

## Méthode de travail

1. Pars de `main` à jour et crée une branche courte.
2. Implémente une seule préoccupation cohérente.
3. Mets à jour code, tests, README, specs et état de handoff dans la même PR.
4. Conserve `pnpm-lock.yaml` et utilise les versions déclarées dans `package.json`.
5. Utilise des commits conventionnels et le modèle de pull request.
6. Ne fusionne qu’après réussite des contrôles GitHub requis.

## Vérifications minimales

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose config --quiet
docker build --tag genengine-web:local .
```

Pour un changement affectant le déploiement ou le parcours connecté :

```bash
docker compose up --build --detach --wait
curl --fail http://localhost:3001/
docker compose down
```

## Pièges connus

- Le développement Next.js utilise `localhost:3000`, tandis que Docker expose `localhost:3001` pour éviter Grafana.
- Dans Docker, `host.docker.internal` désigne l’hôte qui expose les trois API locales.
- Seules les variables `NEXT_PUBLIC_` sont intégrées au bundle navigateur.
- Le mode démonstration doit rester navigable sans backend et clairement identifiable.
- Les routes serveur Next.js forment une façade technique, pas un nouveau service métier.

## Prochaine tâche

Le parcours client actuel couvre catalogue, authentification, Authoring et Play. La prochaine tranche fonctionnelle dépend des contrats du jalon 4 du backend. N’anticipe ni configuration, ni RBAC, ni organisation, ni assistant sans contrat publié et besoin produit validé.
