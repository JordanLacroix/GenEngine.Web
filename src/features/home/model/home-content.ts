/**
 * Contenu éditorial de l'accueil.
 *
 * L'accueil vend le moteur, pas une histoire : il est donc écrit ici plutôt que
 * lu dans la configuration d'un client. Seul l'acte d'ouverture emprunte à la
 * configuration de référence « Le Diapason ». Aucune mesure chiffrée n'est
 * avancée : la plateforme décrit ce qu'elle rend observable, pas des résultats
 * qu'elle n'a pas constatés.
 */

export interface Posture {
  id: string;
  name: string;
  description: string;
}

/**
 * Les catégories du moteur se déclarent par posture — le geste intellectuel
 * travaillé — et non par thème. Cette liste est la valeur par défaut proposée à
 * une organisation ; chaque instance reste libre de la redéfinir.
 */
export const referencePostures: Posture[] = [
  { id: "verify", name: "Vérifier une source", description: "Remonter à l’origine d’une affirmation avant de s’en servir." },
  { id: "compare", name: "Comparer des niveaux de preuve", description: "Distinguer une intuition, un témoignage, une mesure et une démonstration." },
  { id: "limit", name: "Reconnaître une limite", description: "Nommer ce que l’on ne sait pas encore, et ce qui resterait à établir." },
  { id: "proportion", name: "Proportionner une décision", description: "Ajuster l’engagement au degré de certitude réellement atteint." },
  { id: "revise", name: "Réviser un jugement", description: "Changer d’avis sur une base explicite, sans y voir un échec." },
];

export interface Pillar {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
}

/**
 * Les points de configuration listés ci-dessous existent réellement dans le
 * document d'expérience publié par le service Configuration
 * (`ExperienceDocumentContract`). Rien n'y est promis par anticipation.
 */
export const platformPillars: Pillar[] = [
  {
    id: "postures",
    eyebrow: "Catégories",
    title: "Des parcours rangés par posture, pas par thème",
    body:
      "Une catégorie décrit le geste que la personne apprend à poser. Deux scénarios très éloignés "
      + "peuvent travailler la même posture, et un même scénario peut être rejoué pour en révéler une autre.",
    points: [
      "Catégories, parcours et prérequis définis par votre organisation",
      "Affectation par unité hiérarchique et par période d’activité",
      "Un scénario reste jouable de plusieurs manières, sans bonne réponse unique",
    ],
  },
  {
    id: "configuration",
    eyebrow: "Configuration",
    title: "Tout se règle sans écrire une ligne de code",
    body:
      "Le moteur ne présuppose ni votre vocabulaire, ni votre organisation, ni votre modèle pédagogique. "
      + "L’interface de configuration publie une version du document d’expérience, et le client s’y conforme.",
    points: [
      "Vocabulaire du jeu, libellés et langue",
      "Familier d’accompagnement : forme, ton, style, niveau et fréquence d’aide",
      "Rôles, permissions personnalisées et authentification locale ou Entra ID",
      "Économie, magasin, journal, aide contextuelle et introduction",
      "Fournisseur d’IA : hors ligne ou Azure AI Foundry",
    ],
  },
  {
    id: "progression",
    eyebrow: "Progression",
    title: "Des traces, jamais un classement",
    body:
      "La progression se lit comme une mémoire de parcours : ce qui a été découvert, les branches "
      + "ouvertes, les fins atteintes. Elle s’accumule d’une partie à l’autre sans révéler le contenu non parcouru.",
    points: [
      "Journal des décisions et des faits observés",
      "Graphe de quête cumulatif et taux de découverte par scénario",
      "Suivi par unité et par période pour les personnes encadrantes",
      "Aucune note, aucun rang, aucune comparaison entre personnes",
    ],
  },
];

export interface SchoolOutcome {
  id: string;
  title: string;
  body: string;
}

/**
 * Ce qu'une école obtient. Formulé en capacités observables : la plateforme ne
 * revendique aucun gain chiffré qu'elle n'aurait pas mesuré chez le client.
 */
export const schoolOutcomes: SchoolOutcome[] = [
  {
    id: "hours",
    title: "Un dispositif réutilisable d’une promotion à l’autre",
    body:
      "Une configuration publiée sert toutes les promotions suivantes. Les scénarios se rejouent, "
      + "se réaffectent par période et s’amendent depuis le Studio sans redéploiement.",
  },
  {
    id: "evidence",
    title: "Des traces exploitables en évaluation formative",
    body:
      "Chaque partie laisse un chemin lisible : décisions prises, branches ouvertes, postures mobilisées. "
      + "De quoi conduire un débriefing sur la démarche plutôt que sur une réponse.",
  },
  {
    id: "sovereignty",
    title: "Vos contenus et vos comptes restent les vôtres",
    body:
      "Authentification locale ou Entra ID, fournisseur d’IA au choix — y compris entièrement hors ligne. "
      + "Le serveur reste l’autorité sur les sessions et les permissions.",
  },
];

export interface UniverseAct {
  id: string;
  step: string;
  title: string;
  body: string;
}

/** L'ouverture : la configuration de référence, racontée de l'intérieur. */
export const diapasonActs: UniverseAct[] = [
  {
    id: "advent",
    step: "Acte I",
    title: "L’Avènement",
    body: "Tout répond, tout de suite, et très bien. L’effort devient invisible. L’émerveillement aussi.",
  },
  {
    id: "extinction",
    step: "Acte II",
    title: "L’Aile du Doute",
    body: "Une réponse fluide se met à ressembler à une preuve. Certains systèmes sont interdits ; d’autres nient que certaines personnes existent.",
  },
  {
    id: "resistance",
    step: "Acte III",
    title: "La Forge",
    body: "Un collectif de professeurs, de hackers et d’étudiants apprend à ralentir. On vous confie un diapason.",
  },
  {
    id: "judgment",
    step: "Acte IV",
    title: "L’Observatoire",
    body: "Vous reprenez la main sur votre année. Pas en ayant raison : en sachant à quel point vous savez.",
  },
];
