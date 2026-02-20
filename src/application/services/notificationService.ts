import type { AuthContext } from "../../domain/entities";
import { ForbiddenError, NotFoundError } from "../../domain/errors";
import type { AppointmentRepository, DoctorRepository, NotificationRepository, PatientRepository } from "../../domain/repositories";

function canCreateNotifications(auth: AuthContext) {
  return auth.roles.includes("DOCTOR") || auth.roles.includes("ORG_ADMIN");
}

export class NotificationService {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly appointments: AppointmentRepository,
    private readonly patients: PatientRepository,
    private readonly doctors: DoctorRepository,
  ) {}

  async callPatient(auth: AuthContext, input: { appointmentId: string }) {
    if (!canCreateNotifications(auth)) throw new ForbiddenError();

    const doctor = auth.roles.includes("DOCTOR") ? await this.doctors.findByUserId(auth.userId) : null;
    if (auth.roles.includes("DOCTOR") && (!doctor || doctor.organizationId !== auth.organizationId)) {
      throw new NotFoundError("Médico não encontrado");
    }

    const appointment = await this.appointments.findById(input.appointmentId);
    if (!appointment || appointment.organizationId !== auth.organizationId) throw new NotFoundError("Agendamento não encontrado");

    if (doctor && appointment.doctorId !== doctor.id) throw new ForbiddenError();

    const patient = await this.patients.findById(appointment.patientId);
    if (!patient || patient.organizationId !== auth.organizationId) throw new NotFoundError("Paciente não encontrado");

    return this.notifications.create({
      organizationId: auth.organizationId,
      type: "CALL_PATIENT",
      appointmentId: appointment.id,
      patientId: patient.id,
      doctorId: appointment.doctorId,
      createdByUserId: auth.userId,
      payload: {
        patientName: patient.name,
        scheduledAt: appointment.scheduledAt.toISOString(),
      },
    });
  }
}
