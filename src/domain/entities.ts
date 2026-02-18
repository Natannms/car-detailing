export type Uuid = string;

export type Role = "ORG_ADMIN" | "MEMBER";

export type AuthContext = {
  userId: Uuid;
  organizationId: Uuid;
  roles: Role[];
};

export type ProjectType = "SAAS" | "CLIENT" | "INTERNAL" | "MVP" | "POC";
export type Methodology = "SCRUM" | "KANBAN" | "HYBRID" | "WATERFALL";
export type ProjectStatus = "BACKLOG" | "PLANNING" | "EXECUTION" | "HOMOLOGATION" | "PRODUCTION" | "FINISHED" | "CANCELED";
export type HealthStatus = "GREEN" | "YELLOW" | "RED";
export type BillingModel = "FIXED" | "HOURLY" | "MONTHLY";
export type ArchitectureType = "MONOLITH" | "MICROSERVICES" | "EVENT_DRIVEN";
export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type VisibilityLevel = "PRIVATE" | "ORGANIZATION" | "PUBLIC";

export type Client = {
  id: Uuid;
  organizationId: Uuid;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  instagram: string | null;
  linkedin: string | null;
  companyName: string | null;
  notes: string | null;
};

export type Project = {
  id: Uuid;
  organizationId: Uuid;
  name: string;
  code: string;
  summary: string;
  description: string | null;
  type: ProjectType;
  methodology: Methodology;
  status: ProjectStatus;
  health: HealthStatus;
  priority: PriorityLevel;
  complexity: number | null;
  riskLevel: RiskLevel | null;
  startDate: Date;
  estimatedEndDate: Date | null;
  actualEndDate: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  contractValue: number | null;
  billingModel: BillingModel | null;
  slaHours: number | null;
  estimatedBudget: number | null;
  actualCost: number | null;
  expectedMargin: number | null;
  actualMargin: number | null;
  mainStack: string | null;
  architecture: ArchitectureType | null;
  databaseType: string | null;
  cloudProvider: string | null;
  repositoryUrl: string | null;
  allowMultipleTeams: boolean;
  allowMultipleBoards: boolean;
  financialControl: boolean;
  visibility: VisibilityLevel;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  clientId: Uuid | null;
  client?: Client | null;
};

export type Epic = {
  id: Uuid;
  projectId: Uuid;
  title: string;
  context: string | null;
  expected: string | null;
  status: string;
};

export type Story = {
  id: Uuid;
  epicId: Uuid;
  title: string;
  userStory: string;
  acceptanceCriteria: string;
  status: string;
  points: number | null;
};

export type TaskBoardColumn = {
  id: Uuid;
  storyId: Uuid;
  name: string;
  order: number;
};

export type Task = {
  id: Uuid;
  storyId: Uuid;
  title: string;
  description: string | null;
  status: string;
};

export type Organization = {
  id: Uuid;
  name: string;
};

export type User = {
  id: Uuid;
  organizationId: Uuid;
  email: string;
  passwordHash: string | null;
  clerkUserId: string | null;
  roles: Role[];
};

export type InviteToken = {
  id: Uuid;
  organizationId: Uuid;
  tokenHash: string;
  roleToGrant: Role;
  emailHint: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  usedByUserId: Uuid | null;
  createdByUserId: Uuid;
};
