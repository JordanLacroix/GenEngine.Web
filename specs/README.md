# Spécifications GenEngine Web

Ce dossier décrit les intentions, invariants et décisions propres au client Web.

- Le code TypeScript et les tests font autorité sur le comportement exécutable.
- `package.json` et `pnpm-lock.yaml` font autorité sur les dépendances.
- Les contrats HTTP du backend GenEngine font autorité sur les échanges réseau.
- Les specs backend font autorité sur les règles narratives et d’autorisation.

Les instructions de travail ne vivent pas ici : elles sont dans
[`AGENTS.md`](../AGENTS.md) à la racine, source unique du dépôt.

## Index

| Document | Ce qu'il répond |
|---|---|
| [Passage de relais](handoff.md) | Où en est-on réellement ? Ce qui est livré, ce qui est cassé, ce qui est délibérément absent. |
| [Invariants](invariants.md) | Qu'est-ce qui ne doit jamais être cassé ? |
| [Architecture](architecture.md) | Où va quoi, et pourquoi ces frontières ? |
| [Roadmap](roadmap.md) | Quels jalons sont fusionnés, avec quelles réserves ? |
