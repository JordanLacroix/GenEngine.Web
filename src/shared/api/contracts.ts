export type SessionStatus =
  | "AwaitingInput"
  | "Paused"
  | "Completed"
  | "Abandoned"
  | "AwaitingExternalInput"
  | "AwaitingValidation";

export type InteractionKind =
  | "LegacyChoice"
  | "Narration"
  | "ChoiceSet"
  | "Quiz"
  | "CharacteristicGate"
  | "FreeText"
  | "Completed";

export interface SessionContract {
  id: string;
  scenarioId: string;
  scenarioVersionId: string;
  frontId: string;
  snapshotHash: string;
  status: SessionStatus;
  revision: number;
  turn: number;
}

export interface VisibleChoiceContract { id: string; text: string }

export interface TextAnalysisContract {
  interactionId: string;
  isAccepted: boolean;
  matchedTerms: string[];
  minimumMatches: number;
  explanation: string;
}

export interface CurrentStepContract {
  nodeId: string;
  text: string;
  status: SessionStatus;
  choices: VisibleChoiceContract[];
  turn: number;
  interactionId?: string;
  kind: InteractionKind;
  pendingTextAnalysis?: TextAnalysisContract;
}

export interface ConditionEvaluationContract {
  operator: string;
  result: boolean;
  explanation: string;
  children: ConditionEvaluationContract[];
}

export interface NarrativeTreeContract {
  initialNodeId: string;
  currentNodeId: string;
  nodes: Array<{ id: string; text: string; isEnding: boolean; state: "Current" | "Visited" | "Unexplored" | "Locked" }>;
  edges: Array<{
    sourceNodeId: string;
    targetNodeId: string;
    inputId: string;
    text: string;
    isAvailable: boolean;
    evaluation: ConditionEvaluationContract;
  }>;
}

/**
 * Topology of a published scenario version, returned by
 * `GET /scenario-versions/{versionId}/tree` on Play.
 *
 * Deliberately distinct from `NarrativeTreeContract`: outside a session there is
 * no world state, therefore no node `state` and no condition `evaluation`.
 * Do not add either field here — the backend does not send them.
 */
export interface ScenarioStructureContract {
  initialNodeId: string;
  nodes: Array<{ id: string; text: string; isEnding: boolean }>;
  edges: Array<{ sourceNodeId: string; targetNodeId: string; inputId: string; text: string }>;
}

export interface SessionStateContract {
  session: SessionContract;
  currentStep: CurrentStepContract;
  tree: NarrativeTreeContract;
}

export interface InputResultContract {
  session: SessionContract;
  currentStep: CurrentStepContract;
  replayed: boolean;
}

export interface ProblemDetailsContract { title?: string; detail?: string; status?: number }

export interface ScenarioContract { id: string; title: string; revision: number; draftJson: string; frontId: string; categoryId?: string; creationBrief: string; isArchived: boolean; updatedAt: string }
export interface PagedScenariosContract { items: ScenarioContract[]; page: number; pageSize: number; total: number }
export interface ValidationIssueContract { code: string; path: string; message: string; isError: boolean }
export interface ValidationReportContract { issues: ValidationIssueContract[]; isValid: boolean }
export interface StructureReportContract {
  loops: Array<{ nodeIds: string[]; hasExit: boolean; hasGuaranteedExit: boolean }>;
  conditionalDeadEnds: Array<{ nodeId: string; conditionalInputIds: string[]; explanation: string }>;
  unreachableEndingNodeIds: string[];
  nodesWithoutEndingPath: string[];
}
export interface ScenarioPreviewContract { state: unknown; currentStep: CurrentStepContract }
export interface ScenarioVersionContract { id: string; scenarioId: string; number: number; snapshotHash: string; publishedAt: string }

export interface UserAccessContract {
  id: string;
  userName: string;
  roles: Array<{ id: string; name: string; description: string; isSystem: boolean; permissions: string[] }>;
  permissions: string[];
}

export interface ExperienceDocumentContract {
  frontId: string;
  organizationType: "School" | "Company" | "TrainingProvider" | "Community" | "Custom";
  organization: {
    name: string;
    description: string;
    units: Array<{ id: string; parentId?: string; type: string; name: string; code: string; description: string; order: number; enabled: boolean }>;
  };
  game: { name: string; description: string; globalStory: string; locale: string; timeZone: string };
  language: { labels: Record<string, string> };
  authentication: { mode: "LocalOnly" | "EntraOnly" | "Cumulative"; localEnabled: boolean; entraEnabled: boolean; entraTenantId?: string; entraClientId?: string };
  aiProviders: Array<{ id: string; name: string; type: "Offline" | "AzureAiFoundry"; enabled: boolean; endpoint: string; deployment: string; authentication: string; secretReference?: string; capabilities: string[] }>;
  categories: Array<{ id: string; name: string; description: string; accent: string; order: number; isVisible: boolean; imageUrl?: string; tags: string[]; scenarioIds: string[] }>;
  journeys: Array<{ id: string; name: string; description: string; accent: string; imageUrl?: string; order: number; isVisible: boolean; categoryIds: string[]; prerequisiteJourneyIds: string[]; tags: string[] }>;
  assignments: Array<{ id: string; organizationUnitId: string; contentType: "Journey" | "Category" | "Scenario"; contentId: string; name: string; required: boolean; availableFrom?: string; dueAt?: string }>;
  familiars: Array<{ id: string; name: string; description: string; form: string; writingStyle: string; tone: string; accent: string; helpLevel: number; capabilities: string[]; availableForms: string[]; availableTones: string[]; portraitUrl?: string; avatarUrl?: string; backgroundUrl?: string; license?: string; attribution?: string }>;
  economy: {
    currencyCode: string; currencyName: string; currencyIcon: string; initialBalance: number;
    rewardRules: Array<{ trigger: string; referenceId: string; amount: number; description: string }>;
    offers: Array<{ id: string; name: string; description: string; price: number; rewardType: string; rewardReference: string; enabled: boolean }>;
  };
  modules: Array<{ id: string; name: string; description: string; enabled: boolean; requiredPermissions: string[] }>;
  intro: { enabled: boolean; displayPolicy: "EveryLaunch" | "OncePerVersion" | "FirstInstall"; allowSkip: boolean; minimumDisplaySeconds: number; scenes: Array<{ id: string; eyebrow: string; title: string; body: string; imageUrl?: string; order: number }> };
  playerShell: { navigation: Array<{ destination: string; labelKey: string; icon: string; order: number; enabled: boolean; requiredModule?: string }> };
  demo: { enabled: boolean; scenarioSlug: string; targetMinutes: number; familiarId?: string; callToActionLabelKey: string };
  help: { enabled: boolean; articles: Array<{ id: string; slug: string; title: string; summary: string; body: string; contexts: string[]; tags: string[]; order: number; published: boolean }>; glossary: Array<{ term: string; definition: string }> };
  onboarding: { id: string; version: number; enabled: boolean; allowSkip: boolean; requiredAfterUpgrade: boolean; steps: Array<{ id: string; title: string; body: string; target: string; action: string; order: number; required: boolean }> };
  assistantPolicy: { enabled: boolean; requireFirstRunConfiguration: boolean; proactive: boolean; warnOnKnownPath: boolean; defaultFrequency: number; offlineCapabilities: string[] };
  journal: { enabled: boolean; allowExport: boolean; retentionDays: number; showStoryTimeline: boolean };
  /**
   * Plan média du client : ambiances, musiques et fonds par lieu de
   * l'application, plus la bascule de fin de partie.
   *
   * Optionnel *parce qu'il l'est réellement* : le bloc est publié par la tranche
   * moteur qui l'introduit, et les instances antérieures n'en portent pas. Le
   * client ne le crée jamais lui-même — son absence est affichée, pas comblée
   * (invariant 14).
   */
  media?: MediaConfigurationContract;
}

export const mediaLocations = ["home", "map", "player", "journal", "familiar", "shop"] as const;
export type MediaLocationContract = (typeof mediaLocations)[number];

export interface MediaLocationConfigurationContract {
  location: MediaLocationContract;
  ambienceUrl?: string;
  musicUrl?: string;
  backgroundUrl?: string;
  bpm?: number;
  loop?: boolean;
}

export interface MediaConfigurationContract {
  enabled: boolean;
  defaultMuted: boolean;
  locations: MediaLocationConfigurationContract[];
  gameOver?: Omit<MediaLocationConfigurationContract, "location">;
}

export interface PublishedExperienceContract { version: number; publishedAt: string; document: ExperienceDocumentContract }
export interface AdminConfigurationContract { id: string; revision: number; publishedVersion: number; updatedAt: string; publishedAt?: string; document: ExperienceDocumentContract }
export interface PlayerExperienceContract {
  id: string; frontId: string; revision: number; balance: number; currencyCode: string; currencyName: string; currencyIcon: string;
  familiar?: { familiarId: string; form: string; tone: string; writingStyle: string; accent: string; helpLevel: number; customName?: string; interventionFrequency: number; proactive: boolean };
  familiarDefinition?: ExperienceDocumentContract["familiars"][number];
  onboarding: OnboardingStateContract;
  masteries: ScenarioMasteryContract[];
  ownedOfferIds: string[];
  recentEntries: Array<{ id: string; amount: number; reason: string; balanceAfter: number; createdAt: string }>;
  recentJournal: JournalEntryContract[];
}
export interface OnboardingStateContract { tutorialId: string; version: number; status: "NotStarted" | "InProgress" | "Completed" | "Skipped"; completedStepIds: string[]; completedAt?: string; skippedAt?: string; revision: number }
export interface ScenarioMasteryContract { scenarioId: string; scenarioVersionId: string; choiceIds: string[]; nodeIds: string[]; endingIds: string[]; discoveredObjectives: number; totalObjectives: number; masteryPercent: number; updatedAt: string }
export interface JournalEntryContract { id: string; type: string; title: string; summary: string; journeyId?: string; categoryId?: string; scenarioId?: string; scenarioVersionId?: string; sessionId?: string; referenceId?: string; occurredAt: string }
export interface PlayerBootstrapContract { nextAction: "ConfigureFamiliar" | "ResumeOnboarding" | "OpenMap"; experience: PlayerExperienceContract; tutorial: ExperienceDocumentContract["onboarding"]; assistant: ExperienceDocumentContract["assistantPolicy"] }
export interface JournalContract { items: JournalEntryContract[]; total: number; totalsByType: Record<string, number> }
export interface UserContextContract { access: UserAccessContract; experience: PublishedExperienceContract; player: PlayerExperienceContract }
export interface RoleContract { id: string; name: string; description: string; isSystem: boolean; permissions: string[] }
export interface PermissionContract { code: string; description: string }
export interface RoleAssignmentContract { roleId: string; roleName: string; scope: string; expiresAt?: string; assignedAt: string }
export interface AdminUserContract { id: string; userName: string; createdAt: string; isActive: boolean; deletedAt?: string; externalProvider?: string; roleAssignments: RoleAssignmentContract[] }
export interface PagedUsersContract { items: AdminUserContract[]; page: number; pageSize: number; total: number }
export type MembershipKindContract = "Participant" | "Supervisor";
export type AssignedContentTypeContract = "Journey" | "Category" | "Scenario";
export interface OrganizationFrontContract { id: string; frontId: string; name: string; type: string; isActive: boolean; revision: number; updatedAt: string }
export interface OrganizationUnitContract { id: string; frontId: string; parentId?: string; name: string; type: string; code: string; isActive: boolean; revision: number; updatedAt: string }
export interface OperatingPeriodContract { id: string; frontId: string; name: string; code: string; startsAt: string; endsAt: string; isActive: boolean; revision: number; updatedAt: string }
export interface MembershipContract { id: string; frontId: string; unitId: string; userId: string; periodId?: string; kind: MembershipKindContract; startsAt: string; endsAt?: string; isActive: boolean; revision: number; updatedAt: string }
export interface MembershipImportContract { dryRun: boolean; received: number; created: number; unchanged: number; errors: Array<{ row: number; code: string; message: string }> }
export interface ContentAssignmentContract { id: string; frontId: string; unitId: string; contentType: AssignedContentTypeContract; contentId: string; name: string; required: boolean; availableFrom?: string; dueAt?: string; isActive: boolean; revision: number; updatedAt: string }
export interface OrganizationOperationsContract {
  front: OrganizationFrontContract;
  periods: OperatingPeriodContract[];
  units: OrganizationUnitContract[];
  memberships: { items: MembershipContract[]; page: number; pageSize: number; total: number };
  assignments: { items: ContentAssignmentContract[]; page: number; pageSize: number; total: number };
}
export interface PlayerOrganizationContextContract { frontId: string; isMember: boolean; unitIds: string[]; supervisedUnitIds: string[]; assignments: ContentAssignmentContract[]; hasGlobalScope: boolean }
