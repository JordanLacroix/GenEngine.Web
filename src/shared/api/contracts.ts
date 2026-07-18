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
  scenarioVersionId: string;
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

export interface ScenarioContract { id: string; title: string; revision: number; draftJson: string; frontId: string; categoryId?: string; creationBrief: string }
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
  authentication: { mode: "LocalOnly" | "EntraOnly" | "Cumulative"; localEnabled: boolean; entraEnabled: boolean; entraTenantId?: string; entraClientId?: string };
  aiProviders: Array<{ id: string; name: string; type: "Offline" | "AzureAiFoundry"; enabled: boolean; endpoint: string; deployment: string; authentication: string; secretReference?: string; capabilities: string[] }>;
  categories: Array<{ id: string; name: string; description: string; accent: string; order: number; isVisible: boolean }>;
  familiars: Array<{ id: string; name: string; description: string; form: string; writingStyle: string; tone: string; accent: string; helpLevel: number; capabilities: string[]; availableForms: string[]; availableTones: string[] }>;
  economy: {
    currencyCode: string; currencyName: string; currencyIcon: string; initialBalance: number;
    rewardRules: Array<{ trigger: string; referenceId: string; amount: number; description: string }>;
    offers: Array<{ id: string; name: string; description: string; price: number; rewardType: string; rewardReference: string; enabled: boolean }>;
  };
  modules: Array<{ id: string; name: string; description: string; enabled: boolean; requiredPermissions: string[] }>;
}

export interface PublishedExperienceContract { version: number; publishedAt: string; document: ExperienceDocumentContract }
export interface AdminConfigurationContract { id: string; revision: number; publishedVersion: number; updatedAt: string; publishedAt?: string; document: ExperienceDocumentContract }
export interface PlayerExperienceContract {
  id: string; frontId: string; revision: number; balance: number; currencyCode: string; currencyName: string; currencyIcon: string;
  familiar?: { familiarId: string; form: string; tone: string; writingStyle: string; accent: string; helpLevel: number };
  ownedOfferIds: string[];
  recentEntries: Array<{ id: string; amount: number; reason: string; balanceAfter: number; createdAt: string }>;
}
export interface UserContextContract { access: UserAccessContract; experience: PublishedExperienceContract; player: PlayerExperienceContract }
export interface RoleContract { id: string; name: string; description: string; isSystem: boolean; permissions: string[] }
export interface PermissionContract { code: string; description: string }
