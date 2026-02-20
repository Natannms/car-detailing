import type {
  ArchitectureType,
  AttendanceStatus,
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
  Role,
  Appointment,
  AppointmentStatus,
  Doctor,
  Gender,
  Unit,
  BillingType,
  BillingStatus,
  OrganizationBilling,
  AsaasPayment,
  MedicalKanbanCard,
  Notification,
  NotificationType,
  Patient,
  PatientAddress,
  TreatmentType,
  Urgency,
  BloodType,
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
  unitId?: Uuid | null;
  email: string;
  passwordHash?: string | null;
  firebaseUid?: string | null;
  roles: ("ORG_ADMIN" | "MEMBER" | "DOCTOR")[];
};

export type CreateInviteInput = {
  organizationId: Uuid;
  tokenHash: string;
  roleToGrant: Role;
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
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  attachFirebaseUid(id: Uuid, firebaseUid: string): Promise<User>;
  update(id: Uuid, patch: Partial<Pick<User, "organizationId" | "roles" | "unitId">>): Promise<User>;
  listByOrganization(organizationId: Uuid): Promise<User[]>;
}

export type CreateUnitInput = {
  organizationId: Uuid;
  name: string;
  phone?: string | null;
  address?: string | null;
};

export type UpdateUnitPatch = Partial<Omit<Unit, "id" | "organizationId" | "createdAt" | "updatedAt" | "deletedAt">>;

export interface UnitRepository {
  create(input: CreateUnitInput): Promise<Unit>;
  update(id: Uuid, patch: UpdateUnitPatch): Promise<Unit>;
  delete(id: Uuid): Promise<void>;
  findById(id: Uuid): Promise<Unit | null>;
  listByOrganization(organizationId: Uuid): Promise<Unit[]>;
  countByOrganization(organizationId: Uuid): Promise<number>;
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

export type CreatePatientInput = {
  organizationId: Uuid;
  unitId?: Uuid | null;
  patientNumber: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  gender?: Gender | null;
  age?: number | null;
  bloodType?: BloodType | null;
  treatment?: TreatmentType | null;
  cpf?: string | null;
  rg?: string | null;
  address?: PatientAddress | null;
  attendanceStatus?: AttendanceStatus | null;
};

export type UpdatePatientPatch = Partial<Omit<Patient, "id" | "organizationId" | "patientNumber" | "createdAt" | "updatedAt" | "deletedAt">> & {
  address?: PatientAddress | null;
};

export interface PatientRepository {
  create(input: CreatePatientInput): Promise<Patient>;
  update(id: Uuid, patch: UpdatePatientPatch): Promise<Patient>;
  delete(id: Uuid): Promise<void>;
  findById(id: Uuid): Promise<Patient | null>;
  listByOrganization(organizationId: Uuid, unitId?: Uuid | null): Promise<Patient[]>;
  searchByOrganization(organizationId: Uuid, query: string, unitId?: Uuid | null): Promise<Patient[]>;
}

export type CreateDoctorInput = {
  organizationId: Uuid;
  unitId?: Uuid | null;
  userId?: Uuid | null;
  name: string;
  email: string;
  phone?: string | null;
  gender?: Gender | null;
  specialty?: string | null;
};

export type UpdateDoctorPatch = Partial<Omit<Doctor, "id" | "organizationId" | "email" | "createdAt" | "updatedAt" | "deletedAt">>;

export interface DoctorRepository {
  create(input: CreateDoctorInput): Promise<Doctor>;
  update(id: Uuid, patch: UpdateDoctorPatch): Promise<Doctor>;
  delete(id: Uuid): Promise<void>;
  findById(id: Uuid): Promise<Doctor | null>;
  findByEmail(email: string): Promise<Doctor | null>;
  findByUserId(userId: Uuid): Promise<Doctor | null>;
  listByOrganization(organizationId: Uuid, unitId?: Uuid | null): Promise<Doctor[]>;
}

export type CreateAppointmentInput = {
  organizationId: Uuid;
  unitId?: Uuid | null;
  patientId: Uuid;
  doctorId: Uuid;
  scheduledAt: Date;
  status: AppointmentStatus;
  workflowStatus: Appointment["workflowStatus"];
  notes?: string | null;
};

export type UpdateAppointmentPatch = Partial<Omit<Appointment, "id" | "organizationId" | "createdAt" | "updatedAt" | "deletedAt">>;

export interface AppointmentRepository {
  create(input: CreateAppointmentInput): Promise<Appointment>;
  update(id: Uuid, patch: UpdateAppointmentPatch): Promise<Appointment>;
  delete(id: Uuid): Promise<void>;
  findById(id: Uuid): Promise<Appointment | null>;
  listByOrganization(organizationId: Uuid, unitId?: Uuid | null): Promise<Appointment[]>;
}

export type CreateMedicalKanbanCardInput = {
  organizationId: Uuid;
  unitId?: Uuid | null;
  patientId?: Uuid | null;
  clientName: string;
  clientPhone: string;
  urgency: Urgency;
  status: MedicalKanbanCard["status"];
};

export type UpdateMedicalKanbanCardPatch = Partial<Omit<MedicalKanbanCard, "id" | "organizationId" | "createdAt" | "updatedAt">>;

export interface MedicalKanbanCardRepository {
  create(input: CreateMedicalKanbanCardInput): Promise<MedicalKanbanCard>;
  update(id: Uuid, patch: UpdateMedicalKanbanCardPatch): Promise<MedicalKanbanCard>;
  delete(id: Uuid): Promise<void>;
  findById(id: Uuid): Promise<MedicalKanbanCard | null>;
  listByOrganization(organizationId: Uuid, unitId?: Uuid | null): Promise<MedicalKanbanCard[]>;
}

export type CreateNotificationInput = {
  organizationId: Uuid;
  type: NotificationType;
  appointmentId?: Uuid | null;
  patientId?: Uuid | null;
  doctorId?: Uuid | null;
  createdByUserId?: Uuid | null;
  payload?: Record<string, unknown> | null;
};

export interface NotificationRepository {
  create(input: CreateNotificationInput): Promise<Notification>;
}

export interface OrganizationBillingRepository {
  getByOrganizationId(organizationId: Uuid): Promise<OrganizationBilling | null>;
  upsert(organizationId: Uuid, patch: Partial<Omit<OrganizationBilling, "organizationId" | "createdAt">>): Promise<OrganizationBilling>;
  findByAsaasSubscriptionId(asaasSubscriptionId: string): Promise<OrganizationBilling | null>;
}

export interface AsaasPaymentRepository {
  upsert(paymentId: string, input: Omit<AsaasPayment, "paymentId" | "createdAt" | "updatedAt"> & Partial<Pick<AsaasPayment, "raw">>): Promise<AsaasPayment>;
  listByOrganization(organizationId: Uuid, limit?: number): Promise<AsaasPayment[]>;
}

export interface WebhookEventRepository {
  exists(eventId: string): Promise<boolean>;
  markReceived(eventId: string, type: string, raw: Record<string, unknown>): Promise<void>;
  markProcessed(eventId: string, processedAt: Date): Promise<void>;
}
