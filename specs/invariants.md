# Invariants

1. Le backend est l’autorité sur les histoires, sessions, transitions et permissions.
2. Le client ne réimplémente aucune règle de `GenEngine.Narrative`.
3. Le navigateur ne conserve qu’une référence opaque de session, jamais l’état narratif serveur comme source de vérité.
4. Une erreur distante n’active jamais silencieusement une fixture de démonstration.
5. Toute intégration réseau passe par `src/shared/api`.
6. Les fixtures restent dans `src/shared/mocks`.
7. Une feature ne dépend pas directement d’une autre ; la composition vit dans `src/app`.
8. Le JWT reste dans un cookie `HttpOnly` et n’est jamais exposé au JavaScript client.
9. Les URLs internes ne portent pas le préfixe `NEXT_PUBLIC_`.
10. Masquer une action dans l’interface ne remplace jamais l’autorisation côté serveur.
11. La navigation clavier, les contrastes et `prefers-reduced-motion` restent pris en charge.
12. Le mode démonstration reste navigable sans backend et clairement identifiable.
13. Le conteneur de production reste non-root, en lecture seule et doté d’un healthcheck.
14. Les contrats inconnus ou incompatibles échouent explicitement au lieu d’être interprétés silencieusement.
