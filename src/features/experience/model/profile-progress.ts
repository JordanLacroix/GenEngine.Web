import type {
  ConditionalRewardViewContract, PlayerStatViewContract,
  ProgressConditionProgressContract, RewardGrantPlanContract,
} from "@/shared/api/contracts";

/**
 * Présentation pure des statistiques joueur et des récompenses conditionnelles.
 *
 * Toute la logique testable vit ici, hors de React : bornage des jauges,
 * partition obtenues/à venir, et décodage *tolérant* des valeurs d'union
 * (`mode`, nature d'un octroi, `kind` d'une condition). Un type inconnu — un
 * moteur plus récent — est porté tel quel plutôt que rejeté, comme le client le
 * fait déjà pour `nature`/`marker` des documents.
 */

/** Part visible d'une jauge, entre 0 et 100, jamais NaN ni hors bornes. */
export function gaugePercent(value: number, maximum: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(maximum) || maximum <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / maximum) * 100)));
}

export interface StatGauge {
  id: string;
  key: string;
  label: string;
  description: string;
  value: number;
  maximum: number;
  percent: number;
  /** Texte doublant la jauge pour ne jamais faire porter l'information par la seule couleur. */
  valueText: string;
}

/** Une statistique prête à peindre. Une valeur à zéro produit une jauge visible mais vide. */
export function describeStat(stat: PlayerStatViewContract): StatGauge {
  const value = Number.isFinite(stat.value) ? stat.value : 0;
  const maximum = Number.isFinite(stat.maximum) ? stat.maximum : 0;
  return {
    id: stat.id,
    key: stat.key,
    label: stat.label,
    description: stat.description,
    value,
    maximum,
    percent: gaugePercent(value, maximum),
    valueText: `${value} / ${maximum}`,
  };
}

export function describeStats(stats: PlayerStatViewContract[] | undefined): StatGauge[] {
  return (stats ?? []).map(describeStat);
}

const grantNatureLabels: Record<string, string> = {
  Achievement: "Haut fait",
  Title: "Titre",
  Currency: "Monnaie",
};

/**
 * Libellé de la nature d'un octroi. Une nature connue est traduite ; une nature
 * inconnue est rendue **telle quelle** — jamais masquée, jamais devinée.
 */
export function grantNatureLabel(type: string): string {
  return grantNatureLabels[type] ?? type;
}

export interface GrantSummary {
  type: string;
  natureLabel: string;
  /** `true` seulement pour une nature que ce client sait distinguer. */
  known: boolean;
  label: string;
  reference?: string;
  amount?: number;
}

export function describeGrant(grant: RewardGrantPlanContract): GrantSummary {
  return {
    type: grant.type,
    natureLabel: grantNatureLabel(grant.type),
    known: Object.prototype.hasOwnProperty.call(grantNatureLabels, grant.type),
    label: grant.label,
    reference: grant.reference ?? undefined,
    // `amount` n'est porté que par `Currency` ; ailleurs il est absent.
    amount: typeof grant.amount === "number" ? grant.amount : undefined,
  };
}

const rewardModeLabels: Record<string, string> = {
  All: "Toutes les conditions",
  Any: "Une seule condition suffit",
};

/** Libellé du mode d'une récompense. Un mode inconnu retombe sur une phrase neutre. */
export function rewardModeLabel(mode: string): string {
  return rewardModeLabels[mode] ?? "Conditions à remplir";
}

export interface ConditionProgress {
  id: string;
  kind: string;
  description: string;
  satisfied: boolean;
  current: number;
  target: number;
  percent: number;
  progressText: string;
}

export function describeCondition(condition: ProgressConditionProgressContract): ConditionProgress {
  const current = Number.isFinite(condition.current) ? condition.current : 0;
  const target = Number.isFinite(condition.target) ? condition.target : 0;
  return {
    id: condition.id,
    kind: condition.kind,
    description: condition.description,
    satisfied: condition.satisfied,
    current,
    target,
    // Une condition satisfaite est pleine même si le moteur a servi un `current`
    // brut supérieur au plafond (une valeur lue non rebornée).
    percent: condition.satisfied ? 100 : gaugePercent(current, target),
    progressText: `${current} / ${target}`,
  };
}

export interface RewardCard {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
  modeLabel: string;
  conditions: ConditionProgress[];
  grants: GrantSummary[];
  /** Nombre de conditions satisfaites, pour un résumé « 2 / 3 ». */
  satisfiedCount: number;
  conditionCount: number;
}

export function describeReward(reward: ConditionalRewardViewContract): RewardCard {
  const conditions = (reward.conditions ?? []).map(describeCondition);
  return {
    id: reward.id,
    label: reward.label,
    description: reward.description,
    earned: reward.earned,
    earnedAt: reward.earnedAt ?? undefined,
    modeLabel: rewardModeLabel(reward.mode),
    conditions,
    grants: (reward.grants ?? []).map(describeGrant),
    satisfiedCount: conditions.filter((condition) => condition.satisfied).length,
    conditionCount: conditions.length,
  };
}

export interface RewardsBoard {
  earned: RewardCard[];
  upcoming: RewardCard[];
}

/**
 * Partitionne les récompenses en obtenues et à venir. Pas de porte fermée : les
 * deux groupes sont rendus, les obtenues d'abord (les plus récentes en tête),
 * les restantes ensuite avec leur progression.
 */
export function buildRewardsBoard(rewards: ConditionalRewardViewContract[] | undefined): RewardsBoard {
  const cards = (rewards ?? []).map(describeReward);
  const earned = cards
    .filter((card) => card.earned)
    .sort((left, right) => rewardTime(right.earnedAt) - rewardTime(left.earnedAt));
  const upcoming = cards.filter((card) => !card.earned);
  return { earned, upcoming };
}

function rewardTime(earnedAt: string | undefined): number {
  if (!earnedAt) return 0;
  const parsed = Date.parse(earnedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}
