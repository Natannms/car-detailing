export type Uuid = string;

export type Role = "ORG_ADMIN" | "MEMBER" | "DOCTOR";

export type NotificationType = "CALL_PATIENT" | "APPOINTMENT_WORKFLOW_CHANGED" | "APPOINTMENT_STARTED" | "APPOINTMENT_FINISHED";

export type AuthContext = {
  userId: Uuid;
  organizationId: Uuid;
  unitId: Uuid | null;
  roles: Role[];
};

export type Notification = {
  id: Uuid;
  organizationId: Uuid;
  type: NotificationType;
  appointmentId: Uuid | null;
  patientId: Uuid | null;
  doctorId: Uuid | null;
  createdByUserId: Uuid | null;
  payload: Record<string, unknown> | null;
  createdAt: Date;
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

export type Gender = "MASCULINO" | "FEMININO" | "OUTRO";

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type TreatmentType = "CONSULTA" | "EXAME" | "CIRURGIA" | "TERAPIA" | "VACINACAO" | "OUTRO";

export type PatientAddress = {
  street: string;
  district: string;
  city: string;
  state: string;
  number: string;
};

export type AttendanceStatus = "Agent" | "Waiting" | "InProgress" | "Finished";

export type Patient = {
  id: Uuid;
  organizationId: Uuid;
  unitId: Uuid | null;
  patientNumber: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: Gender | null;
  age: number | null;
  bloodType: BloodType | null;
  treatment: TreatmentType | null;
  cpf: string | null;
  rg: string | null;
  address: PatientAddress | null;
  attendanceStatus: AttendanceStatus | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type DoctorSpecialty = string;

export type Doctor = {
  id: Uuid;
  organizationId: Uuid;
  unitId: Uuid | null;
  userId: Uuid | null;
  name: string;
  email: string;
  phone: string | null;
  gender: Gender | null;
  specialty: DoctorSpecialty | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type AppointmentStatus =
  | "AGENDADO"
  | "PRIMEIRA_CONSULTA"
  | "RETORNO"
  | "URGENCIA"
  | "EMERGENCIA"
  | "AVALIACAO"
  | "ENCAMINHAMENTO"
  | "PRE_OPERATORIO"
  | "POS_OPERATORIO"
  | "MANUTENCAO"
  | "TELECONSULTA_ONLINE"
  | "RETORNO_REMARCADO";

export type AppointmentWorkflowStatus = "RECEPCAO" | "AGUARDANDO" | "EM_ATENDIMENTO" | "FINALIZADO";

export type Appointment = {
  id: Uuid;
  organizationId: Uuid;
  unitId: Uuid | null;
  patientId: Uuid;
  doctorId: Uuid;
  scheduledAt: Date;
  status: AppointmentStatus;
  workflowStatus: AppointmentWorkflowStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type Urgency = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

export type MedicalKanbanColumnName = "Agente" | "Aguardando atendimento" | "Em atendimento" | "Finalizado";

export type MedicalKanbanCard = {
  id: Uuid;
  organizationId: Uuid;
  unitId: Uuid | null;
  patientId: Uuid | null;
  clientName: string;
  clientPhone: string;
  urgency: Urgency;
  status: MedicalKanbanColumnName;
  createdAt: Date;
  updatedAt: Date;
};

export type Organization = {
  id: Uuid;
  name: string;
};

export type Unit = {
  id: Uuid;
  organizationId: Uuid;
  name: string;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type BillingType = "PIX" | "CREDIT_CARD";

export type BillingStatus = "PENDING" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export type OrganizationBilling = {
  organizationId: Uuid;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  planId: string | null;
  billingType: BillingType | null;
  status: BillingStatus;
  validUntil: Date | null;
  currentPaymentId: string | null;
  currentInvoiceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AsaasPayment = {
  organizationId: Uuid;
  paymentId: string;
  subscriptionId: string | null;
  customerId: string | null;
  status: string;
  value: number | null;
  dueDate: Date | null;
  invoiceUrl: string | null;
  billingType: string | null;
  raw: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type User = {
  id: Uuid;
  organizationId: Uuid;
  unitId: Uuid | null;
  email: string;
  passwordHash: string | null;
  firebaseUid: string | null;
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
