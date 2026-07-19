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
- Conserve la direction visuelle GenEngine. Les cinq teintes de référence sont encre `#17344a`, ivoire `#fffaf0`, sauge `#7a9a55`, or `#d7a746` et azur `#2f7fa0` ; les alias `ink`, `ivory`, `ember` et `verdigris` en dérivent dans `globals.css`.
- Garde l’application plein écran : toute navigation est une surcouche HUD, jamais un bandeau de page.
- La démonstration ne s’adresse qu’aux visiteurs anonymes ; aucune sortie vers elle en état connecté.
- Le son reste optionnel, désactivé par défaut, et ne porte jamais seul une information.

## Configuration et autorisation obligatoires

Adapté des obligations du dépôt `GenEngine`. Côté client, la règle centrale se
reformule ainsi : **une permission masquée dans l'interface n'est pas un contrôle
d'accès ; le serveur applique toujours la sienne.**

- Toute nouvelle capacité déclare dans la même PR ses paramètres, leur défaut, leur portée, leur validation et le comportement obtenu lorsqu'elle est désactivée.
- Le client teste des permissions et des portées effectives, jamais un nom de rôle : les rôles sont personnalisables par l'exploitant.
- Masquer une action, griser un bouton ou retirer une entrée de navigation relève de la présentation. Le refus fait autorité seulement lorsqu'il vient du service propriétaire, et son message est affiché tel quel.
- Une capacité que le moteur déployé n'expose pas est **annoncée absente**, jamais simulée : ni bloc de configuration fabriqué localement, ni catalogue d'assets inventé, ni fixture substituée à une erreur distante.
- L'isolation par organisation est résolue et appliquée côté serveur. Le client reflète le résultat ; il ne le recalcule pas.
- Aucun secret ne transite par le navigateur. Une référence opaque peut être configurée, jamais la valeur.
- Le parcours anonyme reste jouable sans backend, sans cloud et sans IA : la démonstration hors ligne est ce repli, et elle est cantonnée à `src/shared/mocks`.

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

Ces sept commandes sont exactement celles du job `quality` de
[`.github/workflows/ci.yml`](.github/workflows/ci.yml), dans le même ordre. Si tu
en ajoutes une ici, ajoute-la aussi au workflow ; sinon elle n'est pas vérifiée.

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
- Le dépôt **n'a pas de linter Markdown**. La CI ne vérifie que le TypeScript, les tests, le build, Compose et l'image Docker : la justesse de la documentation reste une responsabilité humaine, pas un contrôle automatique.
- Le pack `diapason-core` **déclare ses manques** dans `gaps[]` (`public/packs/manifest.json`). Lis-les avant d'affirmer qu'un média existe : il n'y a ni boucle d'ambiance, ni musique longue, ni illustration peinte.
- Les illustrations de `public/illustrations/` sont des visuels d'heroic fantasy hérités d'une itération antérieure. Elles ne correspondent pas à la direction artistique Diapason ; ne les décris pas comme telles.

## Prochaine tâche

Aucune tranche n'est engagée, et aucun défaut n'est identifié sur `main`. Avant
d'ouvrir une tranche, lis [`specs/handoff.md`](specs/handoff.md), qui distingue ce
qui est livré, ce qui est cassé et ce qui est délibérément absent.

Deux chantiers sont identifiés et non commencés. **Aucun des deux n'est du code
client** :

1. **Champs média du schéma narratif.** `visualUrl`, `visualDescription`,
   `soundUrl` et `animationCue` sont édités et prévisualisés par le Studio mais
   refusés à l'enregistrement par le moteur (`422 invalid_json`). Dépendance du
   dépôt `GenEngine`.
2. **Direction artistique.** Ni le pack CC0 ni les illustrations livrées ne
   servent l'univers Diapason. C'est une production d'assets.

Réserve mineure sur la carte : au-delà de six catégories publiées, une porte est
décalée en spirale et tombe hors clairière dessinée (`doorAnchorForIndex`). Jamais
superposée, mais pas placée à la main.

N'implémente rien au-delà sans besoin utilisateur validé.
