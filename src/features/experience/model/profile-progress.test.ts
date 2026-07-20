import { describe, expect, it } from "vitest";
import type {
  ConditionalRewardViewContract, PlayerStatViewContract,
} from "@/shared/api/contracts";
import {
  buildRewardsBoard, describeGrant, describeReward, describeStat, describeStats,
  gaugePercent, grantNatureLabel, rewardModeLabel,
} from "./profile-progress";

function stat(overrides: Partial<PlayerStatViewContract> = {}): PlayerStatViewContract {
  return { id: "s1", key: "focus", label: "Concentration", description: "Ce qu'elle mesure", value: 3, maximum: 10, ...overrides };
}

function reward(overrides: Partial<ConditionalRewardViewContract> = {}): ConditionalRewardViewContract {
  return {
    id: "r1", label: "Éveil", description: "Cinq récits terminés", earned: false, earnedAt: null,
    mode: "All",
    conditions: [{ id: "c1", kind: "ScenariosCompleted", description: "Terminer 5 récits", satisfied: false, current: 2, target: 5 }],
    grants: [{ type: "Achievement", label: "Premier éveil", reference: "first-awakening", amount: null }],
    ...overrides,
  };
}

describe("gaugePercent", () => {
  it("borne entre 0 et 100 et n'explose jamais sur un plafond nul", () => {
    expect(gaugePercent(3, 10)).toBe(30);
    expect(gaugePercent(0, 10)).toBe(0);
    expect(gaugePercent(50, 10)).toBe(100);
    expect(gaugePercent(1, 0)).toBe(0);
    expect(gaugePercent(Number.NaN, 10)).toBe(0);
  });
});

describe("describeStat", () => {
  it("double la jauge d'un texte valeur/plafond, même à zéro", () => {
    const gauge = describeStat(stat({ value: 0 }));
    expect(gauge.percent).toBe(0);
    expect(gauge.valueText).toBe("0 / 10");
  });
  it("expose libellé et description sans les réécrire", () => {
    const gauge = describeStat(stat());
    expect(gauge.label).toBe("Concentration");
    expect(gauge.description).toBe("Ce qu'elle mesure");
    expect(gauge.percent).toBe(30);
  });
});

describe("décodage tolérant", () => {
  it("stats absentes ne cassent rien", () => {
    expect(describeStats(undefined)).toEqual([]);
    expect(describeStats([])).toEqual([]);
  });
  it("un mode inconnu retombe sur une phrase neutre plutôt que d'échouer", () => {
    expect(rewardModeLabel("All")).toBe("Toutes les conditions");
    expect(rewardModeLabel("Any")).toBe("Une seule condition suffit");
    expect(rewardModeLabel("Weighted")).toBe("Conditions à remplir");
  });
  it("une nature d'octroi inconnue est portée telle quelle", () => {
    expect(grantNatureLabel("Currency")).toBe("Monnaie");
    expect(grantNatureLabel("Cosmetic")).toBe("Cosmetic");
    const grant = describeGrant({ type: "Cosmetic", label: "Cape", reference: "cape", amount: null });
    expect(grant.known).toBe(false);
    expect(grant.natureLabel).toBe("Cosmetic");
  });
  it("lit amount pour Currency et l'ignore ailleurs", () => {
    expect(describeGrant({ type: "Currency", label: "Accords", reference: null, amount: 100 }).amount).toBe(100);
    expect(describeGrant({ type: "Title", label: "Sage", reference: "sage", amount: null }).amount).toBeUndefined();
  });
  it("rewards absentes rendent un tableau vide des deux côtés", () => {
    expect(buildRewardsBoard(undefined)).toEqual({ earned: [], upcoming: [] });
  });
});

describe("describeReward", () => {
  it("montre la progression d'une condition non satisfaite", () => {
    const card = describeReward(reward());
    expect(card.earned).toBe(false);
    expect(card.satisfiedCount).toBe(0);
    expect(card.conditionCount).toBe(1);
    expect(card.conditions[0]!.percent).toBe(40);
    expect(card.conditions[0]!.progressText).toBe("2 / 5");
  });
  it("remplit la jauge d'une condition satisfaite même si le current brut dépasse le plafond", () => {
    const card = describeReward(reward({
      conditions: [{ id: "c1", kind: "PlayerStatReached", description: "Atteindre 5", satisfied: true, current: 8, target: 5 }],
    }));
    expect(card.conditions[0]!.percent).toBe(100);
    expect(card.satisfiedCount).toBe(1);
  });
});

describe("buildRewardsBoard", () => {
  it("sépare obtenues et à venir, les obtenues les plus récentes en tête", () => {
    const board = buildRewardsBoard([
      reward({ id: "old", earned: true, earnedAt: "2026-01-01T00:00:00Z" }),
      reward({ id: "pending", earned: false, earnedAt: null }),
      reward({ id: "fresh", earned: true, earnedAt: "2026-06-01T00:00:00Z" }),
    ]);
    expect(board.earned.map((card) => card.id)).toEqual(["fresh", "old"]);
    expect(board.upcoming.map((card) => card.id)).toEqual(["pending"]);
  });
});
