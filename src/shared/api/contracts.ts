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
  | "Document"
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

export interface ChoiceMediaContract { soundUrl?: string; animationCue?: string }
export interface VisibleChoiceContract { id: string; text: string; media?: ChoiceMediaContract | null }
export interface NodeMediaContract { visualUrl?: string; visualDescription?: string; soundUrl?: string }

/**
 * Documents consultables du schéma de scénario v6.
 *
 * Le contenu est porté par le scénario publié — donc versionné, hashé et
 * rejoué comme le reste. Le client ne va rien chercher et n'invente rien : il
 * rend ce que le moteur envoie, y compris l'aveu d'échantillonnage.
 */
export const documentNatures = ["Memo", "Email", "Code", "Diff", "Log", "Table", "Conversation", "Report", "Other"] as const;
export type DocumentNatureContract = (typeof documentNatures)[number];

/** Marqueur d'une ligne : couvre le diff (`Added`…) et le journal (`Warning`…). */
export const documentLineMarkers = ["Added", "Removed", "Context", "Warning", "Error", "Info"] as const;
export type DocumentLineMarkerContract = (typeof documentLineMarkers)[number];

export const documentExcerptUnits = ["Lines", "Rows", "Messages", "Entries", "Paragraphs"] as const;
export type DocumentExcerptUnitContract = (typeof documentExcerptUnits)[number];

export interface DocumentParagraphBlockContract { $type: "paragraph"; text: string }
export interface DocumentLineContract { text: string; marker?: DocumentLineMarkerContract | string | null; label?: string | null }
export interface DocumentLinesBlockContract { $type: "lines"; lines: DocumentLineContract[] }
export interface DocumentTableRowContract { cells: string[] }
export interface DocumentTableBlockContract { $type: "table"; columns: string[]; rows: DocumentTableRowContract[] }
export type DocumentBlockContract =
  | DocumentParagraphBlockContract
  | DocumentLinesBlockContract
  | DocumentTableBlockContract;

export interface DocumentHeaderContract { name: string; value: string }

/**
 * Aveu d'échantillonnage. `shownUnits` est **strictement** inférieur à
 * `totalUnits` — le moteur refuse l'égalité, parce qu'une mention qui ne
 * retranche rien ne dirait rien. Un document montré intégralement n'en porte
 * pas, et l'absence du bloc est donc l'information « c'est tout ».
 */
export interface DocumentExcerptContract { shownUnits: number; totalUnits: number; unit: DocumentExcerptUnitContract | string }

export interface DocumentContract {
  title: string;
  nature: DocumentNatureContract | string;
  headers?: DocumentHeaderContract[] | null;
  excerpt?: DocumentExcerptContract | null;
  blocks: DocumentBlockContract[];
}

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
  pendingTextAnalysis?: TextAnalysisContract | null;
  media?: NodeMediaContract | null;
  /** L'interaction courante peut être ignorée (schéma de scénario v4). */
  isOptional?: boolean;
  /**
   * Choix de sortie du nœud, à présenter **à côté** de l'interaction et jamais
   * après elle : le moteur garantit que cette liste est vide lorsque
   * l'interaction est obligatoire, donc sa présence *est* l'autorisation de
   * partir sans jouer l'interaction.
   */
  exitChoices?: VisibleChoiceContract[] | null;
  /** Renseigné uniquement lorsque `kind` vaut `Document`. */
  document?: DocumentContract | null;
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
  /**
   * Bloc de marque, **facultatif et purement additif** : une configuration
   * antérieure sans ce bloc reste lisible à l'identique et `branding` vaut
   * alors `null`. Le client ne le fabrique jamais.
   */
  branding?: BrandingContract | null;
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

/**
 * Jetons de couleur obligatoires dès que `branding.theme` est présent. Le
 * moteur les impose tous les huit, donc le client peut les projeter en
 * variables CSS sans valeur de repli par jeton.
 */
export const brandingColorTokens = ["ink", "surface", "accent", "accentAlt", "success", "warning", "danger", "muted"] as const;
export type BrandingColorTokenContract = (typeof brandingColorTokens)[number];

export interface BrandingThemeContract {
  colors: Record<BrandingColorTokenContract, string> & Record<string, string>;
  colorScheme: "Dark" | "Light" | "Auto";
  cornerRadius: number;
  fontFamily: string;
}

export interface BrandingContract {
  applicationName?: string | null;
  shortName?: string | null;
  tagline?: string | null;
  brandIconUrl?: string | null;
  clientIconUrl?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  theme?: BrandingThemeContract | null;
  /**
   * Associe les jetons nommés portés par `categories[].accent`,
   * `journeys[].accent` et `familiars[].accent` à de vraies couleurs. Sans
   * elle ces accents ne sont **pas rendables**, et le client les ignore
   * plutôt que d'en inventer.
   */
  accentPalette?: Record<string, string> | null;
}

/**
 * `GET /client-bootstrap/{frontId}` sur Configuration — **anonyme**.
 *
 * Charge utile minimale d'un client qui démarre avant toute authentification :
 * de quoi peindre le premier écran et proposer une entrée, rien de plus. Aucun
 * catalogue, aucune organisation, aucun provider IA. Une configuration
 * illisible fait retomber le client sur « GenEngine ».
 */
export interface ClientBootstrapContract {
  frontId: string;
  version: number;
  publishedAt: string;
  applicationName: string;
  shortName?: string | null;
  tagline?: string | null;
  branding?: BrandingContract | null;
  locale: string;
  timeZone: string;
  labels: Record<string, string>;
  authenticationMode: ExperienceDocumentContract["authentication"]["mode"];
  demoEnabled: boolean;
  intro?: ExperienceDocumentContract["intro"] | null;
}

/**
 * `GET /admin/configuration/field-descriptors` sur Configuration — `config.read`.
 *
 * Le moteur documente **chaque** champ du document d'expérience et garde cette
 * documentation exhaustive par un test de complétude bidirectionnel : un champ
 * sans descripteur échoue, un descripteur orphelin aussi. Le client
 * **consomme** ces textes ; il n'en recopie aucun, sans quoi ils divergeraient
 * en silence dès la première évolution du schéma.
 *
 * `path` suit la notation du document, `[]` marquant une collection :
 * `game.name`, `branding.theme.colors`, `aiProviders[].deployment`.
 */
export interface FieldDescriptorContract {
  /** Chemin du champ dans le document, `[]` pour une collection. */
  path: string;
  /** Libellé court. */
  label: string;
  /** Ce dont il s'agit. */
  description: string;
  /** Une valeur d'exemple, quand elle éclaire plus qu'un paraphrase. */
  example?: string | null;
  /** La contrainte réelle appliquée par le moteur, ou `null` s'il n'y en a pas. */
  constraint?: string | null;
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
