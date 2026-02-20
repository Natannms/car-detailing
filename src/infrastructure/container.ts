import { FirebaseClientRepository } from "../adapters/repositories/firebaseClientRepository";
import { FirebaseEpicRepository } from "../adapters/repositories/firebaseEpicRepository";
import { FirebaseInviteTokenRepository } from "../adapters/repositories/firebaseInviteTokenRepository";
import { FirebaseOrganizationRepository } from "../adapters/repositories/firebaseOrganizationRepository";
import { FirebaseProjectRepository } from "../adapters/repositories/firebaseProjectRepository";
import { FirebaseStoryRepository } from "../adapters/repositories/firebaseStoryRepository";
import { FirebaseTaskBoardColumnRepository } from "../adapters/repositories/firebaseTaskBoardColumnRepository";
import { FirebaseTaskRepository } from "../adapters/repositories/firebaseTaskRepository";
import { FirebaseUserRepository } from "../adapters/repositories/firebaseUserRepository";
import { FirebaseAppointmentRepository } from "../adapters/repositories/firebaseAppointmentRepository";
import { FirebaseDoctorRepository } from "../adapters/repositories/firebaseDoctorRepository";
import { FirebaseMedicalKanbanCardRepository } from "../adapters/repositories/firebaseMedicalKanbanCardRepository";
import { FirebasePatientRepository } from "../adapters/repositories/firebasePatientRepository";
import { FirebaseNotificationRepository } from "../adapters/repositories/firebaseNotificationRepository";
import { FirebaseOrganizationBillingRepository } from "../adapters/repositories/firebaseOrganizationBillingRepository";
import { FirebaseAsaasPaymentRepository } from "../adapters/repositories/firebaseAsaasPaymentRepository";
import { FirebaseWebhookEventRepository } from "../adapters/repositories/firebaseWebhookEventRepository";
import { FirebaseUnitRepository } from "../adapters/repositories/firebaseUnitRepository";
import { AuthService } from "../application/services/authService";
import { EpicService } from "../application/services/epicService";
import { BacklogImportService } from "../application/services/backlogImportService";
import { InviteService } from "../application/services/inviteService";
import { FirebaseUserSyncService } from "../application/services/firebaseUserSyncService";
import { ClientService } from "../application/services/clientService";
import { ProjectService } from "../application/services/projectService";
import { StoryService } from "../application/services/storyService";
import { TaskService } from "../application/services/taskService";
import { TaskBoardColumnService } from "../application/services/taskBoardColumnService";
import { PatientService } from "../application/services/patientService";
import { DoctorService } from "../application/services/doctorService";
import { AppointmentService } from "../application/services/appointmentService";
import { MedicalKanbanService } from "../application/services/medicalKanbanService";
import { NotificationService } from "../application/services/notificationService";
import { AppointmentWorkflowService } from "../application/services/appointmentWorkflowService";
import { BillingGateService } from "../application/services/billingGateService";
import { BillingService } from "../application/services/billingService";
import { UnitService } from "../application/services/unitService";
import { OverviewService } from "../application/services/overviewService";

export const repositories = {
  organizations: new FirebaseOrganizationRepository(),
  users: new FirebaseUserRepository(),
  invites: new FirebaseInviteTokenRepository(),
  clients: new FirebaseClientRepository(),
  projects: new FirebaseProjectRepository(),
  epics: new FirebaseEpicRepository(),
  stories: new FirebaseStoryRepository(),
  tasks: new FirebaseTaskRepository(),
  taskBoardColumns: new FirebaseTaskBoardColumnRepository(),
  units: new FirebaseUnitRepository(),
  patients: new FirebasePatientRepository(),
  doctors: new FirebaseDoctorRepository(),
  appointments: new FirebaseAppointmentRepository(),
  medicalKanbanCards: new FirebaseMedicalKanbanCardRepository(),
  notifications: new FirebaseNotificationRepository(),
  organizationBilling: new FirebaseOrganizationBillingRepository(),
  asaasPayments: new FirebaseAsaasPaymentRepository(),
  webhookEvents: new FirebaseWebhookEventRepository(),
};

export const services = {
  auth: new AuthService(repositories.organizations, repositories.users),
  authSync: new FirebaseUserSyncService(repositories.organizations, repositories.users, repositories.units),
  invites: new InviteService(repositories.organizations, repositories.users, repositories.invites),
  clients: new ClientService(repositories.clients),
  projects: new ProjectService(repositories.projects, repositories.clients),
  epics: new EpicService(repositories.projects, repositories.epics),
  stories: new StoryService(repositories.projects, repositories.epics, repositories.stories),
  tasks: new TaskService(repositories.projects, repositories.epics, repositories.stories, repositories.tasks),
  taskBoardColumns: new TaskBoardColumnService(
    repositories.projects,
    repositories.epics,
    repositories.stories,
    repositories.tasks,
    repositories.taskBoardColumns,
  ),
  backlogImport: new BacklogImportService(repositories.projects, repositories.epics, repositories.stories, repositories.tasks),
  units: new UnitService(repositories.units, repositories.users, repositories.organizationBilling),
  patients: new PatientService(repositories.patients),
  doctors: new DoctorService(repositories.doctors),
  appointments: new AppointmentService(repositories.appointments, repositories.patients, repositories.doctors),
  appointmentWorkflow: new AppointmentWorkflowService(
    repositories.appointments,
    repositories.doctors,
    repositories.patients,
    repositories.notifications,
  ),
  medicalKanban: new MedicalKanbanService(repositories.medicalKanbanCards, repositories.patients),
  notifications: new NotificationService(repositories.notifications, repositories.appointments, repositories.patients, repositories.doctors),
  billingGate: new BillingGateService(repositories.organizationBilling),
  billing: new BillingService(repositories.organizationBilling, repositories.asaasPayments, repositories.webhookEvents),
  overview: new OverviewService(
    repositories.patients,
    repositories.doctors,
    repositories.units,
    repositories.appointments,
    repositories.organizationBilling,
  ),
};
