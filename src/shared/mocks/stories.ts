import type { DemoStory, StorySummary } from "@/entities/story/model/story";

export const featuredStories: StorySummary[] = [
  { id: "the-last-beacon", slug: "the-last-beacon", title: "Le dernier phare", eyebrow: "Mystère maritime", synopsis: "Une lumière s'allume sur une île rayée des cartes. Cette nuit, elle vous appelle par votre nom.", author: "Mara Vellum", durationMinutes: 28, mood: "mystery", accent: "ember" },
  { id: "glass-garden", slug: "glass-garden", title: "Le jardin de verre", eyebrow: "Conte onirique", synopsis: "Chaque fleur garde un souvenir. Brisez la mauvaise, et une vie entière disparaît.", author: "Noor Aster", durationMinutes: 18, progress: 42, mood: "wonder", accent: "verdigris" },
  { id: "seven-trains", slug: "seven-trains", title: "Le train de 07 h 07", eyebrow: "Aventure temporelle", synopsis: "Sept wagons, sept époques. Votre billet ne mentionne aucune destination.", author: "Ilan Roche", durationMinutes: 35, progress: 12, mood: "adventure", accent: "gold" },
];

export const demoStory: DemoStory = {
  ...featuredStories[0]!,
  openingSceneId: "shore",
  scenes: [
    { id: "shore", chapter: "I · La côte aux oiseaux muets", title: "La lumière qui connaissait votre nom", atmosphere: "Minuit · Marée montante", body: ["La barque touche le sable sans un bruit. Devant vous, le phare découpe le brouillard d'un seul trait d'ambre.", "Trois éclats. Une pause. Puis trois autres — le rythme exact que votre père utilisait autrefois pour vous rappeler à la maison."], choices: [{ id: "follow", label: "Suivre la lumière jusqu'au phare", nextSceneId: "path", tone: "Courage" }, { id: "listen", label: "Rester sur la grève et écouter", nextSceneId: "sea", tone: "Intuition" }] },
    { id: "path", chapter: "II · Le sentier des absents", title: "Des pas devant les vôtres", atmosphere: "Brouillard dense · Vent d'est", body: ["Dans la boue, une seconde paire d'empreintes apparaît. Elles avancent à votre rythme, toujours deux pas devant.", "Au pied du phare, la porte est entrouverte. De l'intérieur monte le parfum du thé noir et du bois mouillé."], choices: [{ id: "enter", label: "Pousser la porte", nextSceneId: "keeper", tone: "Détermination" }] },
    { id: "sea", chapter: "II · Ce que la mer rapporte", title: "La voix sous les vagues", atmosphere: "Marée haute · Silence total", body: ["Sous le ressac, quelqu'un récite les noms des habitants de l'île. Le dernier est le vôtre.", "Une clé de cuivre roule entre les galets. Elle est encore chaude quand vous la ramassez."], choices: [{ id: "key", label: "Porter la clé au phare", nextSceneId: "keeper", tone: "Confiance" }] },
    { id: "keeper", chapter: "III · Le gardien", title: "Quelqu'un vous attendait", atmosphere: "Lanterne · Avant l'aube", body: ["La pièce est vide, mais deux tasses fument sur la table. Entre elles repose le journal de votre père, ouvert à la date de demain.", "Au sommet de la page, une phrase : « Si tu lis ceci, la lumière a choisi son nouveau gardien. »"], choices: [{ id: "again", label: "Recommencer cette traversée", nextSceneId: "shore", tone: "Nouvelle voie" }] },
  ],
};
