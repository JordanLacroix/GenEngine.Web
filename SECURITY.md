# Politique de sécurité

## Versions prises en charge

GenEngine Web est en phase préliminaire. Seule la branche `main` reçoit des correctifs de sécurité jusqu’à la première version stable.

| Version | Prise en charge |
|---|---|
| `main` | Oui |
| Anciennes révisions | Non |

## Signaler une vulnérabilité

N’ouvrez pas d’issue publique et ne publiez pas de preuve d’exploitation.

Utilisez le [signalement privé GitHub](https://github.com/JordanLacroix/GenEngine.Web/security/advisories/new) avec le composant et la révision concernés, l’impact, les préconditions, des étapes minimales et une preuve nettoyée de toute donnée sensible.

Un accusé de réception est visé sous 7 jours. Après validation, la correction est préparée de façon privée et la divulgation coordonnée. Aucun programme de prime n’est proposé actuellement.

## Périmètre

Sont notamment concernés : exposition du JWT, contournement des cookies `HttpOnly`, injection dans les routes serveur, exposition involontaire de variables backend au navigateur, traversal ou SSRF, compromission de l’image Docker et vulnérabilités de dépendances.

Les problèmes de sécurité du backend doivent être signalés dans le [dépôt GenEngine](https://github.com/JordanLacroix/GenEngine/security/advisories/new).
