import type { AppointmentWorkflowStatus, AuthContext } from "../../domain/entities";
import { ForbiddenError, NotFoundError } from "../../domain/errors";
import type { AppointmentRepository, DoctorRepository, NotificationRepository, PatientRepository } from "../../domain/repositories";

type WorkflowAction = "TO_RECEPTION" | "TO_WAITING" | "START" | "FINISH";

function canMoveWorkflow(auth: AuthContext) {
  return auth.roles.includes("ORG_ADMIN") || auth.roles.includes("MEMBER") || auth.roles.includes("DOCTOR");
}

function targetForAction(action: WorkflowAction): AppointmentWorkflowStatus {
  if (action === "TO_RECEPTION") return "RECEPCAO";
  if (action === "TO_WAITING") return "AGUARDANDO";
  if (action === "START") return "EM_ATENDIMENTO";
  return "FINALIZADO";
}

export class AppointmentWorkflowService {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly doctors: DoctorRepository,
    private readonly patients: PatientRepository,
    private readonly notifications: NotificationRepository,
  ) {}

  async transition(auth: AuthContext, input: { appointmentId: string; action: WorkflowAction }) {
    if (!canMoveWorkflow(auth)) throw new ForbiddenError();

    const appointment = await this.appointments.findById(input.appointmentId);
    if (!appointment || appointment.organizationId !== auth.organizationId) throw new NotFoundError("Agendamento não encontrado");

    if (auth.roles.includes("DOCTOR")) {
      const doctor = await this.doctors.findByUserId(auth.userId);
      if (!doctor || doctor.organizationId !== auth.organizationId) throw new NotFoundError("Médico não encontrado");
      if (appointment.doctorId !== doctor.id) throw new ForbiddenError();
      if (input.action === "TO_RECEPTION" || input.action === "TO_WAITING") throw new ForbiddenError();
    }

    const from = appointment.workflowStatus ?? "AGUARDANDO";
    const to = targetForAction(input.action);

    if (input.action === "START") {
      if (from === "FINALIZADO") throw new ForbiddenError();
      const all = (await this.appointments.listByOrganization(auth.organizationId)).filter(
        a => a.unitId === appointment.unitId || a.unitId === null,
      );
      const active = all.find(a => a.doctorId === appointment.doctorId && a.workflowStatus === "EM_ATENDIMENTO" && !a.deletedAt);
      if (active && active.id !== appointment.id) throw new ForbiddenError();

      const waiting = all
        .filter(a => a.doctorId === appointment.doctorId && a.workflowStatus !== "FINALIZADO" && a.workflowStatus !== "EM_ATENDIMENTO" && !a.deletedAt)
        .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
      const first = waiting[0];
      if (first && first.id !== appointment.id) throw new ForbiddenError();
    }

    if (input.action === "FINISH") {
      if (from !== "EM_ATENDIMENTO") throw new ForbiddenError();
    }

    await this.appointments.update(appointment.id, { workflowStatus: to });

    const patient = await this.patients.findById(appointment.patientId);
    const patientName = patient?.name ?? null;

    const notificationType =
      input.action === "START" ? "APPOINTMENT_STARTED" : input.action === "FINISH" ? "APPOINTMENT_FINISHED" : "APPOINTMENT_WORKFLOW_CHANGED";

    await this.notifications.create({
      organizationId: auth.organizationId,
      type: notificationType,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      createdByUserId: auth.userId,
      payload: {
        from,
        to,
        action: input.action,
        patientName,
        scheduledAt: appointment.scheduledAt.toISOString(),
      },
    });

    return { ok: true };
  }
}
