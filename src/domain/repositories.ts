import type {
  ArchitectureType,
  BillingModel,
  Client,
  Epic,
  HealthStatus,
  InviteToken,
  Methodology,
  Organization,
  PriorityLevel,
  Project,
  ProjectStatus,
  ProjectType,
  RiskLevel,
  Story,
  Task,
  User,
  Uuid,
  VisibilityLevel,
} from "./entities";

export type CreateProjectInput = {
  organizationId: Uuid;
  clientId?: Uuid | null;
  name: string;
  code: string;
  summary: string;
  description?: string | null;
  type: ProjectType;
  methodology: Methodology;
  status?: ProjectStatus;
  health?: HealthStatus;
  priority?: PriorityLevel;
  complexity?: number | null;
  riskLevel?: RiskLevel | null;
  startDate: Date;
  estimatedEndDate?: Date | null;
  actualEndDate?: Date | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  contractValue?: number | null;
  billingModel?: BillingModel | null;
  slaHours?: number | null;
  estimatedBudget?: number | null;
  actualCost?: number | null;
  expectedMargin?: number | null;
  actualMargin?: number | null;
  mainStack?: string | null;
  architecture?: ArchitectureType | null;
  databaseType?: string | null;
  cloudProvider?: string | null;
  repositoryUrl?: string | null;
  allowMultipleTeams?: boolean;
  allowMultipleBoards?: boolean;
  financialControl?: boolean;
  visibility?: VisibilityLevel;
};

export type CreateClientInput = {
  organizationId: Uuid;
  name: string;
  code?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  companyName?: string | null;
  notes?: string | null;
};

export type CreateEpicInput = {
  projectId: Uuid;
  title: string;
  context?: string | null;
  expected?: string | null;
  status?: string;
};

export type CreateStoryInput = {
  epicId: Uuid;
  title: string;
  userStory: string;
  acceptanceCriteria: string;
  status?: string;
  points?: number | null;
};

export type CreateTaskInput = {
  storyId: Uuid;
  title: string;
  description?: string | null;
  status?: string;
};

export type CreateOrganizationInput = {
  name: string;
};

export type CreateUserInput = {
  organizationId: Uuid;
  email: string;
  passwordHash?: string | null;
  clerkUserId?: string | null;
  roles: ("ORG_ADMIN" | "MEMBER")[];
};

export type CreateInviteInput = {
  organizationId: Uuid;
  tokenHash: string;
  emailHint?: string | null;
  expiresAt: Date;
  createdByUserId: Uuid;
};

export interface ProjectRepository {
  create(input: CreateProjectInput): Promise<Project>;
  findById(id: Uuid): Promise<Project | null>;
  findByCode(code: string): Promise<Project | null>;
  findByOrgAndName(organizationId: Uuid, name: string): Promise<Project | null>;
  listByOrganization(organizationId: Uuid): Promise<Project[]>;
}

export interface ClientRepository {
  create(input: CreateClientInput): Promise<Client>;
  findById(id: Uuid): Promise<Client | null>;
  findByOrgAndName(organizationId: Uuid, name: string): Promise<Client | null>;
  findByOrgAndCode(organizationId: Uuid, code: string): Promise<Client | null>;
  listByOrganization(organizationId: Uuid): Promise<Client[]>;
}

export interface OrganizationRepository {
  create(input: CreateOrganizationInput): Promise<Organization>;
  findById(id: Uuid): Promise<Organization | null>;
  findByName(name: string): Promise<Organization | null>;
}

export interface UserRepository {
  create(input: CreateUserInput): Promise<User>;
  findById(id: Uuid): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByClerkUserId(clerkUserId: string): Promise<User | null>;
  attachClerkUserId(id: Uuid, clerkUserId: string): Promise<User>;
  listByOrganization(organizationId: Uuid): Promise<User[]>;
}

export interface InviteTokenRepository {
  create(input: CreateInviteInput): Promise<InviteToken>;
  findByTokenHash(tokenHash: string): Promise<InviteToken | null>;
  markUsed(id: Uuid, usedAt: Date, usedByUserId: Uuid): Promise<void>;
  listByOrganization(organizationId: Uuid): Promise<InviteToken[]>;
  revoke(id: Uuid): Promise<void>;
}

export interface EpicRepository {
  create(input: CreateEpicInput): Promise<Epic>;
  update(id: Uuid, patch: Partial<Omit<Epic, "id" | "projectId">>): Promise<Epic>;
  delete(id: Uuid): Promise<void>;
  findById(id: Uuid): Promise<Epic | null>;
  findByProjectAndTitle(projectId: Uuid, title: string): Promise<Epic | null>;
  listByProject(projectId: Uuid): Promise<Epic[]>;
}

export interface StoryRepository {
  create(input: CreateStoryInput): Promise<Story>;
  update(id: Uuid, patch: Partial<Omit<Story, "id" | "epicId">>): Promise<Story>;
  delete(id: Uuid): Promise<void>;
  findById(id: Uuid): Promise<Story | null>;
  findByEpicAndTitle(epicId: Uuid, title: string): Promise<Story | null>;
  listByEpic(epicId: Uuid): Promise<Story[]>;
}

export interface TaskRepository {
  create(input: CreateTaskInput): Promise<Task>;
  update(id: Uuid, patch: Partial<Omit<Task, "id" | "storyId">>): Promise<Task>;
  delete(id: Uuid): Promise<void>;
  findById(id: Uuid): Promise<Task | null>;
  findByStoryAndTitle(storyId: Uuid, title: string): Promise<Task | null>;
  listByStory(storyId: Uuid): Promise<Task[]>;
}

export type CreateTaskBoardColumnInput = {
  storyId: Uuid;
  name: string;
  order: number;
};

export interface TaskBoardColumnRepository {
  create(input: CreateTaskBoardColumnInput): Promise<{ id: Uuid; storyId: Uuid; name: string; order: number }>;
  update(id: Uuid, patch: Partial<Pick<CreateTaskBoardColumnInput, "name" | "order">>): Promise<{ id: Uuid; storyId: Uuid; name: string; order: number }>;
  delete(id: Uuid): Promise<void>;
  findById(id: Uuid): Promise<{ id: Uuid; storyId: Uuid; name: string; order: number } | null>;
  findByStoryAndName(storyId: Uuid, name: string): Promise<{ id: Uuid; storyId: Uuid; name: string; order: number } | null>;
  listByStory(storyId: Uuid): Promise<{ id: Uuid; storyId: Uuid; name: string; order: number }[]>;
}
