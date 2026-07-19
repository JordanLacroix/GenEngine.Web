import type { DemoStory, StorySummary } from "@/entities/story/model/story";

/**
 * Contenu de démonstration hors ligne, tiré de la configuration de référence
 * « Le Diapason » (bible d'univers du dépôt GenEngine, `specs/domain/diapason`).
 *
 * La démonstration échantillonne trois usages différents du moteur plutôt qu'une
 * seule histoire : une situation de lucidité, une situation de conflit
 * professionnel, et une situation d'apprentissage d'une matière — ici le Spec
 * Driven Development. Le visiteur choisit sa situation depuis un nœud d'accueil.
 *
 * Convention de nommage reprise du contenu canonique : `fin-accord-*` pour la
 * posture atteinte, `fin-partielle-*` pour le bon résultat mal consolidé,
 * `fin-rupture-*` pour l'échec qui impose de reprendre. Le moteur n'expose aucun
 * drapeau d'échec ; le champ `outcome` reste local à la démonstration.
 *
 * Cette fixture n'est jamais servie à la place d'une erreur distante.
 */
export const featuredStories: StorySummary[] = [
  {
    id: "diapason-demonstration",
    slug: "diapason-demonstration",
    title: "Le Diapason — trois situations",
    eyebrow: "Lucidité · Courage · Transmission",
    synopsis: "2026. Vous êtes en alternance, sans autorité, et vous savez trois choses que personne au-dessus de vous ne sait.",
    author: "Configuration de référence Le Diapason",
    durationMinutes: 12,
    mood: "mystery",
    accent: "ember",
  },
  {
    id: "identite-non-reconnue",
    slug: "identite-non-reconnue",
    title: "Identité non reconnue",
    eyebrow: "Discernement",
    synopsis: "Un score de 0,71 sous un seuil de 0,85 que personne n'a choisi. Ce n'est pas une décision, c'est un refus.",
    author: "Configuration de référence Le Diapason",
    durationMinutes: 16,
    progress: 42,
    mood: "wonder",
    accent: "verdigris",
  },
  {
    id: "la-competence-qui-s-efface",
    slug: "la-competence-qui-s-efface",
    title: "La compétence qui s'efface",
    eyebrow: "Autonomie",
    synopsis: "Panne réseau, pas d'assistant, et un module que vous avez écrit en janvier. Vous savez tout de lui sauf comment il marche.",
    author: "Configuration de référence Le Diapason",
    durationMinutes: 13,
    progress: 12,
    mood: "adventure",
    accent: "gold",
  },
];

export const demoStory: DemoStory = {
  ...featuredStories[0]!,
  durationMinutes: 12,
  openingSceneId: "accueil",
  scenes: [
    {
      id: "accueil",
      chapter: "Prologue · Trois situations",
      title: "Ce que vous avez, et que personne d'autre n'a",
      atmosphere: "Juillet 2026 · Onze semaines d'alternance",
      body: [
        "Vous êtes en alternance dans une entreprise de quatre cents personnes depuis onze semaines. Vous n'avez aucune autorité, aucun budget, et personne ne vous demande votre avis. Vous avez en revanche une information de terrain que personne au-dessus de vous ne possède — et c'est vrai trois fois cette semaine, dans trois pièces différentes.",
        "Le Diapason ne vous apprend pas à avoir raison. Il vous met dans la pièce, avec l'heure qui tourne, et vous laisse découvrir ce que coûte le fait de le dire. Choisissez la situation par laquelle commencer : chacune se termine en quelques minutes, et aucune ne propose de bonne réponse à cocher.",
      ],
      choices: [
        { id: "situation-note", label: "Mardi, 8 h 12 — une note de service que personne ne revendique", nextSceneId: "note-arrivee", tone: "Lucidité" },
        { id: "situation-reunion", label: "Jeudi, 14 h 00 — neuf cadres, une recommandation, et un chiffre faux", nextSceneId: "reunion-table", tone: "Courage" },
        { id: "situation-specification", label: "Lundi, 9 h 30 — dix jours pour livrer, et une constante que personne n'a décidée", nextSceneId: "spec-demande", tone: "Transmission" },
      ],
    },

    {
      id: "note-arrivee",
      chapter: "Lucidité · Acte Avènement",
      title: "La note de service",
      atmosphere: "Mardi 8 h 12 · Réunion d'équipe à 9 h",
      body: [
        "Une note de deux pages attend dans la boîte commune. Objet : « Réorganisation du périmètre Données — application immédiate ». Les astreintes passent de trois à cinq personnes, deux prestataires ne seront pas reconduits, et la décision a été « validée collégialement ». Personne dans l'open space n'a l'air de découvrir quoi que ce soit. Personne n'a l'air d'y croire non plus.",
        "Le texte est parfait. Trop lisse, trop équilibré, avec cette manière de conclure chaque paragraphe sur une formule apaisante. En bas, pas de signature : une mention de service et un horodatage.",
      ],
      interaction: { kind: "object", label: "Ouvrir les propriétés du fichier", hint: "Un document porte son origine dans ses métadonnées ; la lire prend quatre secondes." },
      choices: [
        { id: "note-relayer", label: "Relayer la note dans le canal de l'équipe pour que tout le monde soit au courant", nextSceneId: "fin-rupture-relais", tone: "Lucidité" },
        { id: "note-verifier", label: "Chercher qui a réellement produit ce texte avant d'en parler", nextSceneId: "note-provenance", tone: "Lucidité" },
      ],
    },
    {
      id: "note-provenance",
      chapter: "Lucidité · La source",
      title: "6 h 47, compte applicatif",
      atmosphere: "Mardi 8 h 31 · Vingt-neuf minutes",
      body: [
        "Créé ce matin à 6 h 47. Auteur : un compte applicatif. Vous remontez la chaîne jusqu'au fichier d'entrée — un brouillon de cadrage qui présente quatre hypothèses de réorganisation sans en retenir aucune. L'hypothèse 2 est celle de la note.",
        "Le mot « validée » n'apparaît nulle part dans la source. Il est apparu quelque part entre le brouillon et les deux pages que quarante personnes viennent de lire. La note n'est pas fausse : elle a rendu vraie une hypothèse en la mettant en forme.",
      ],
      choices: [
        { id: "note-impression", label: "Le dire à la réunion : cette note ne vous inspire pas confiance", nextSceneId: "fin-partielle-intuition", tone: "Lucidité" },
        { id: "note-chaine", label: "Écrire la chaîne : fichier source, horodatage, compte producteur, hypothèse retenue", nextSceneId: "note-reunion", tone: "Lucidité" },
      ],
    },
    {
      id: "note-reunion",
      chapter: "Lucidité · Neuf heures",
      title: "Trois lignes et une capture d'écran",
      atmosphere: "Mardi 9 h 02 · Salle Sextant",
      body: [
        "La note est au premier point de l'ordre du jour, traitée comme un fait acquis. Votre tutrice ouvre le tour de table par la logistique : qui prend quelle semaine d'astreinte.",
        "Vous avez trois lignes et une capture d'écran. Vous pouvez les poser maintenant, avant que les semaines soient distribuées — ou attendre que quelqu'un de mieux placé remarque la même chose que vous.",
      ],
      choices: [
        { id: "note-poser", label: "Poser la chaîne de provenance avant que les astreintes soient distribuées", nextSceneId: "fin-accord-provenance", tone: "Lucidité" },
        { id: "note-attendre", label: "Attendre : quelqu'un finira bien par vérifier", nextSceneId: "fin-rupture-inertie", tone: "Lucidité" },
      ],
    },
    {
      id: "fin-accord-provenance",
      chapter: "Fin · Accord",
      title: "Une hypothèse redevenue une hypothèse",
      atmosphere: "Mardi 9 h 14",
      outcome: "accord",
      body: [
        "Vous n'avez pas dit que la note était fausse. Vous avez dit d'où elle venait, à quelle heure, produite par quoi, à partir de quel fichier, et que le mot « validée » n'était dans aucune version de la source. Il a fallu quarante secondes, et personne n'a eu à vous croire sur parole.",
        "La réunion a changé d'objet. Les astreintes n'ont pas été distribuées ce matin-là, et les deux prestataires ont appris leur reconduction avant midi. Ce que vous avez rendu opposable, ce n'est pas votre doute : c'est une date de création à 6 h 47.",
      ],
      choices: [],
    },
    {
      id: "fin-partielle-intuition",
      chapter: "Fin · Partielle",
      title: "Vous aviez raison, et cela n'a pas suffi",
      atmosphere: "Mardi 9 h 08",
      outcome: "partielle",
      body: [
        "« Elle ne m'inspire pas confiance » est une phrase invérifiable. Votre tutrice a répondu qu'elle comprenait, qu'elle regarderait, et la réunion a continué. Elle a regardé le lendemain ; entre-temps les astreintes avaient été distribuées et un prestataire avait cherché un autre contrat.",
        "Le fond était juste. Ce qui manquait tenait en une ligne : l'horodatage et le compte producteur, que vous aviez sous les yeux. Rejouez : la même scène se gagne avec un fait daté au lieu d'une impression.",
      ],
      choices: [],
    },
    {
      id: "fin-rupture-relais",
      chapter: "Rupture · Le relais",
      title: "Vous l'avez rendue vraie",
      atmosphere: "Mardi 8 h 23",
      outcome: "rupture",
      body: [
        "Vous avez diffusé le document à quarante personnes en trois secondes, avec la seule chose qui lui manquait : quelqu'un qui l'assume. À 9 h, la note n'était plus un fichier sans auteur, elle était « ce que l'équipe a reçu ce matin ». Les astreintes ont été distribuées dessus. Deux prestataires ne l'ont pas été.",
        "L'enquête interne a duré six jours et n'a désigné personne, parce qu'il n'y avait personne à désigner : une hypothèse de cadrage, un compte applicatif à 6 h 47, et une chaîne humaine qui n'a rien vérifié. Il n'y a rien à rattraper depuis ce point. Reprenez au mardi matin ; la note attend toujours dans la boîte commune.",
      ],
      choices: [],
    },
    {
      id: "fin-rupture-inertie",
      chapter: "Rupture · L'attente",
      title: "Personne n'a vérifié à votre place",
      atmosphere: "Mardi 11 h 40",
      outcome: "rupture",
      body: [
        "Vous avez attendu. Neuf personnes ont lu la même note que vous et aucune n'a ouvert les propriétés du fichier — non par négligence, mais parce qu'un texte propre et daté ne donne aucune raison de le faire. Vous étiez la seule personne à en avoir une.",
        "À 11 h 40, le planning d'astreintes était signé et la réorganisation actée. Une décision que personne n'avait prise est devenue une décision que personne ne peut plus défaire. Reprenez : la fenêtre où votre information valait quelque chose durait cinquante minutes.",
      ],
      choices: [],
    },

    {
      id: "reunion-table",
      chapter: "Courage · Acte Avènement",
      title: "La réunion où personne ne doute",
      atmosphere: "Jeudi 14 h 00 · Neuf cadres, un projecteur",
      body: [
        "La recommandation a été produite à partir de quatre-vingts documents internes. Elle est claire, chiffrée, et les neuf personnes autour de la table l'ont lue. Trois ont dit qu'elle recoupait leur intuition. Le comité valide dans vingt minutes.",
        "Le point 3 dimensionne le réseau logistique sur quatre entrepôts. Il y en a cinq depuis janvier. Vous le savez parce que vous avez câblé l'intégration du cinquième en mars, seule, pendant trois semaines. Vous êtes la seule personne du bâtiment à l'avoir fait.",
      ],
      interaction: { kind: "signal", label: "Relire le point 3", hint: "Le raisonnement a été vérifié par neuf personnes. Ses entrées ne l'ont été par personne." },
      choices: [
        { id: "reunion-silence", label: "Se taire : neuf cadres expérimentés ont validé, l'erreur est probablement de votre côté", nextSceneId: "fin-rupture-silence", tone: "Courage" },
        { id: "reunion-parler", label: "Prendre la parole maintenant, avant le vote", nextSceneId: "reunion-formulation", tone: "Courage" },
      ],
    },
    {
      id: "reunion-formulation",
      chapter: "Courage · La première phrase",
      title: "Tout se joue sur la formulation",
      atmosphere: "Jeudi 14 h 06 · Quatorze minutes",
      body: [
        "Vous levez la main. La salle se tourne vers vous et vous disposez d'environ six secondes avant que l'attention retombe. Ce que vous allez dire ne sera pas jugé sur sa justesse, mais sur ce qu'il oblige la salle à faire.",
        "Deux phrases vous viennent. L'une nomme un responsable. L'autre nomme un écart.",
      ],
      choices: [
        { id: "reunion-accuser", label: "« Le point 3 est faux, personne n'a vérifié les données d'entrée. »", nextSceneId: "reunion-repli", tone: "Courage" },
        { id: "reunion-ecart", label: "« Le point 3 dimensionne sur quatre entrepôts. Nous en exploitons cinq depuis janvier. »", nextSceneId: "reunion-verification", tone: "Courage" },
      ],
    },
    {
      id: "reunion-verification",
      chapter: "Courage · L'écart",
      title: "Quinze secondes de silence",
      atmosphere: "Jeudi 14 h 09",
      body: [
        "Personne ne vous contredit, parce qu'un nombre d'entrepôts n'est pas une opinion. Le directeur des opérations ouvre son téléphone et confirme. La question qui suit n'est pas « avez-vous raison » mais « qu'est-ce qu'on fait des vingt minutes qui restent ».",
        "Votre tutrice vous regarde. Elle peut reprendre le sujet à son compte pour la suite du comité : ce serait plus confortable pour vous, et plus audible pour eux.",
      ],
      choices: [
        { id: "reunion-porter", label: "Porter vous-même le constat : vous êtes la seule à connaître l'intégration", nextSceneId: "fin-accord-ecart", tone: "Courage" },
        { id: "reunion-deleguer", label: "Laisser votre tutrice reprendre le sujet", nextSceneId: "fin-rupture-sous-traitance", tone: "Courage" },
      ],
    },
    {
      id: "reunion-repli",
      chapter: "Courage · Le repli",
      title: "Vous avez nommé un coupable",
      atmosphere: "Jeudi 14 h 07 · Douze minutes",
      body: [
        "« Personne n'a vérifié » met neuf personnes en position de se défendre, et la première réponse arrive tout de suite : la méthode a été validée, les sources sont internes, et vous êtes ici depuis onze semaines. L'échange dérive sur votre légitimité pendant deux minutes ; le point 3 n'est plus au centre.",
        "Il vous reste douze minutes et un crédit très entamé. Vous pouvez encore poser le seul élément que personne ne peut vous retirer.",
      ],
      choices: [
        { id: "reunion-reformuler", label: "Revenir au fait : quatre entrepôts au point 3, cinq en exploitation", nextSceneId: "fin-partielle-reformulation", tone: "Courage" },
      ],
    },
    {
      id: "fin-accord-ecart",
      chapter: "Fin · Accord",
      title: "Un comité qui ne vote pas",
      atmosphere: "Jeudi 14 h 21",
      outcome: "accord",
      body: [
        "Le comité n'a pas voté. Le point 3 est reparti en révision avec la seule personne capable de dire ce que change le cinquième entrepôt sur les flux — vous. Ce n'était pas du courage au sens où on l'entend d'habitude : vous avez choisi le moment (avant le vote), la forme (un écart vérifiable) et le destinataire (la salle entière, pas un couloir).",
        "La recommandation n'était pas mauvaise. Neuf personnes en avaient vérifié le raisonnement, et aucune les entrées. C'est le défaut le plus courant et le plus cher de 2026.",
      ],
      choices: [],
    },
    {
      id: "fin-partielle-reformulation",
      chapter: "Fin · Partielle",
      title: "Rattrapé de justesse",
      atmosphere: "Jeudi 14 h 19",
      outcome: "partielle",
      body: [
        "Le fait a fini par passer et le point 3 est reparti en révision. Mais il aura fallu douze minutes, une discussion sur votre ancienneté et l'intervention de votre tutrice pour que la salle y revienne. Vous avez dépensé pour être écoutée un crédit que vous n'aurez pas la prochaine fois.",
        "La différence entre les deux phrases ne tenait pas au courage : elle tenait à ce qu'elles obligeaient la salle à faire — se défendre, ou vérifier. Rejouez la scène en ouvrant par l'écart.",
      ],
      choices: [],
    },
    {
      id: "fin-rupture-silence",
      chapter: "Rupture · Le silence",
      title: "L'expérience supposée des autres",
      atmosphere: "Jeudi 14 h 20",
      outcome: "rupture",
      body: [
        "Le comité a validé à l'unanimité. Le dimensionnement est parti en appel d'offres sur quatre entrepôts, le cinquième a été traité en exception manuelle pendant huit mois, et deux personnes ont été recrutées pour tenir cette exception. Personne ne saura jamais que la décision reposait sur une donnée de décembre.",
        "Vous vous êtes tue parce que neuf personnes expérimentées étaient d'accord. Elles étaient d'accord sur un raisonnement, pas sur ses entrées, et vous étiez la seule personne du bâtiment à connaître les entrées. La situation ne se rattrape pas après le vote. Reprenez avant.",
      ],
      choices: [],
    },
    {
      id: "fin-rupture-sous-traitance",
      chapter: "Rupture · La délégation",
      title: "Le courage sous-traité",
      atmosphere: "Jeudi 15 h 40",
      outcome: "rupture",
      body: [
        "Votre tutrice a repris le sujet, de bonne foi, avec ce qu'elle en savait — c'est-à-dire un nombre. Interrogée sur les flux inter-sites, elle n'a pas pu répondre. Faute de réponse dans la salle, le comité a estimé l'écart mineur et maintenu la recommandation avec une réserve au procès-verbal.",
        "La réserve n'a jamais été instruite. Vous aviez l'information ; vous l'avez confiée à quelqu'un qui ne pouvait pas la défendre. Une objection portée par la mauvaise personne coûte autant qu'une objection tue. Reprenez.",
      ],
      choices: [],
    },

    {
      id: "spec-demande",
      chapter: "Transmission · Acte Résistance",
      title: "La spécification avant le code",
      atmosphere: "Lundi 9 h 30 · Dix jours",
      body: [
        "La demande fait trois phrases : « Permettre au client d'annuler une commande et d'être remboursé automatiquement. Prévoir les cas partiels. Livraison dans dix jours. » Vous la collez dans l'assistant pour cadrer. Avant que vous ayez fini de lire, l'implémentation complète est là — services, migrations, gestion d'erreurs, tests.",
        "Elle est bonne. Elle est cohérente. En haut du fichier de configuration, une ligne : REFUND_WINDOW_HOURS = 24. Personne n'a décidé vingt-quatre heures. Ce nombre n'est nulle part dans la demande.",
      ],
      interaction: { kind: "object", label: "Chercher l'origine de la constante", hint: "Une valeur par défaut recopiée d'une documentation devient une décision politique sans décideur." },
      choices: [
        { id: "spec-coder", label: "Partir de ce code : il est propre, et dix jours c'est court", nextSceneId: "fin-rupture-constante", tone: "Transmission" },
        { id: "spec-ecrire", label: "Fermer l'éditeur et écrire d'abord ce qui doit être vrai", nextSceneId: "spec-affirmations", tone: "Transmission" },
      ],
    },
    {
      id: "spec-affirmations",
      chapter: "Transmission · Neuf affirmations",
      title: "Ce qui doit être vrai",
      atmosphere: "Lundi 11 h 15 · Neuf lignes, aucune ligne de code",
      body: [
        "Vous écrivez neuf affirmations vérifiables. « Un remboursement intégral est possible tant que la commande n'est pas expédiée. » « Au-delà, le remboursement est partiel et proratisé sur les articles non expédiés. » « La fenêtre de remboursement est de quarante-huit heures. » — celle-là, vous êtes allée la demander au métier, qui a répondu quarante-huit sans hésiter une seconde.",
        "Neuf affirmations, dont trois qu'aucun modèle ne pouvait deviner : elles ne sont écrites nulle part, elles vivent dans la tête de deux personnes au service client.",
      ],
      interaction: { kind: "gesture", label: "Nommer le cas limite absent", hint: "Votre propre spécification en oublie un : la commande expédiée puis refusée à la livraison. Le scénario complet vous demande de le formuler vous-même, en texte libre." },
      choices: [
        { id: "spec-signer", label: "Faire signer les neuf affirmations par le métier avant d'écrire quoi que ce soit", nextSceneId: "spec-tests", tone: "Transmission" },
        { id: "spec-classer", label: "Classer le document et commencer à développer : le temps presse", nextSceneId: "fin-rupture-document-mort", tone: "Transmission" },
      ],
    },
    {
      id: "spec-tests",
      chapter: "Transmission · L'autorité",
      title: "Trois règles échouent",
      atmosphere: "Jeudi 16 h 05 · Six jours restants",
      body: [
        "Les neuf affirmations sont devenues neuf tests avant la première ligne d'implémentation. Vous laissez ensuite l'assistant proposer le code : il produit à peu près la même chose que lundi, en quatre minutes.",
        "Six tests passent. Trois échouent — exactement les trois règles métier qu'aucun modèle ne pouvait deviner, dont la fenêtre à quarante-huit heures. La suite de tests vient de faire ce qu'aucune relecture humaine n'aurait fait à cette vitesse : dire non, précisément, à un code convaincant.",
      ],
      choices: [
        { id: "spec-autorite", label: "Corriger jusqu'au vert, et faire de la suite l'autorité du projet", nextSceneId: "fin-accord-specification", tone: "Transmission" },
        { id: "spec-recette", label: "Noter les trois écarts et les traiter à la recette, avec le reste", nextSceneId: "fin-partielle-recette", tone: "Transmission" },
      ],
    },
    {
      id: "fin-accord-specification",
      chapter: "Fin · Accord",
      title: "Ce qui reste rare n'est plus le code",
      atmosphere: "Vendredi 18 h 00 · Livré à J+8",
      outcome: "accord",
      body: [
        "Livré en huit jours au lieu de dix. Ce n'est pas l'implémentation qui a pris du temps — elle en a pris quatre minutes — mais les six heures passées à écrire ce qui devait être vrai et à le faire signer. Ces six heures sont le seul endroit du projet où une décision a été prise.",
        "Deux mois plus tard, une évolution est demandée. Le code a été réécrit deux fois depuis ; les neuf affirmations, elles, sont toujours là, toujours exécutées à chaque intégration. C'est exactement là que vit le Spec Driven Development : l'implémentation est devenue instantanée, la décision écrite ne l'est pas.",
      ],
      choices: [],
    },
    {
      id: "fin-partielle-recette",
      chapter: "Fin · Partielle",
      title: "Une spécification que rien n'exécute",
      atmosphere: "J+9 · Recette",
      outcome: "partielle",
      body: [
        "Les trois écarts sont arrivés en recette avec vingt-deux autres points. Deux ont été corrigés ; le troisième — la fenêtre de remboursement — a été jugé mineur et reporté. Il est parti en production à vingt-quatre heures. Le service client l'a découvert en quatre jours, sur onze dossiers.",
        "Vous aviez la bonne spécification, écrite et signée. Elle est restée un document. Ce qui la rend opposable, c'est qu'elle échoue automatiquement quand le code s'en écarte, et pas plus tard. Rejouez la fin.",
      ],
      choices: [],
    },
    {
      id: "fin-rupture-constante",
      chapter: "Rupture · La constante",
      title: "Vingt-quatre heures que personne n'a décidées",
      atmosphere: "J+38 · Réunion de crise",
      outcome: "rupture",
      body: [
        "Vous avez livré en six jours. Trente-huit jours plus tard, réunion de crise : la fenêtre de remboursement est de vingt-quatre heures, le métier l'a toujours fixée à quarante-huit, et deux cent dix clients ont été refusés à tort. Interrogée sur l'origine de la règle, vous avez expliqué qu'elle vous avait semblé raisonnable.",
        "C'est exact : elle l'était. Elle venait d'un exemple de documentation, recopié par un modèle, validé par personne, et vous l'avez rationalisée après coup au lieu de chercher qui l'avait décidée. Un défaut de ce type ne se répare pas en production, il se prévient avant la première ligne. Reprenez au lundi matin.",
      ],
      choices: [],
    },
    {
      id: "fin-rupture-document-mort",
      chapter: "Rupture · Le document mort",
      title: "Signé, classé, jamais exécuté",
      atmosphere: "J+10 · Mise en production",
      outcome: "rupture",
      body: [
        "Vos neuf affirmations étaient justes, et le document existe toujours, à jour, dans l'espace partagé. Le code livré en contredit quatre. Personne ne s'en est aperçu, parce qu'entre le document et le code il n'y avait rien : aucun test ne reliait l'un à l'autre.",
        "Vous avez transmis un raisonnement à des humains occupés au lieu de le transmettre à une machine qui vérifie. C'est la forme la plus coûteuse de bonne intention : elle a l'air d'un travail fait. Reprenez, et transformez les affirmations en tests avant de développer.",
      ],
      choices: [],
    },
  ],
};
