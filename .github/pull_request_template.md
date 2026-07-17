## Résumé

<!-- Que change cette PR ? -->

## Pourquoi

<!-- Besoin résolu et valeur apportée. -->

## Périmètre

### Inclus

-

### Hors périmètre

-

## Contexte de revue

- **Invariants à préserver :**
- **Fichiers critiques :**
- **Risques connus :**
- **Points à challenger :**

## Backend, sécurité et accessibilité

- **Contrats API concernés :** aucun / préciser
- **Configuration et défauts :** aucun / préciser
- **Permissions :** aucune / préciser la vérification serveur
- **Mode démonstration :** inchangé / préciser
- **Cookies, variables serveur et données sensibles :** inchangés / préciser
- **Clavier, contrastes et réduction des animations :** vérifiés / non applicable

## Validation

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose config --quiet
docker build --tag genengine-web:local .
```

## Checklist

- [ ] La PR est focalisée et son besoin est explicite.
- [ ] Lint, typecheck, tests et build passent.
- [ ] Les invariants et la séparation démo/production sont préservés.
- [ ] L’accessibilité a été vérifiée pour toute modification visuelle.
- [ ] Les changements d’API, de configuration ou de Docker sont documentés.
- [ ] README, specs et handoff reflètent l’état réel.
- [ ] Aucun secret, `.env.local` ou artefact généré n’est présent.
- [ ] Tous les contrôles GitHub requis sont verts.
