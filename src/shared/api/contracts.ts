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

export interface ScenarioContract { id: string; title: string; revision: number; draftJson: string }
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
