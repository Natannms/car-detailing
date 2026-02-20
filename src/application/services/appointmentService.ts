import type { AuthContext } from "../../domain/entities";
import { ForbiddenError, NotFoundError } from "../../domain/errors";
import type { AppointmentRepository, CreateAppointmentInput, DoctorRepository, PatientRepository, UpdateAppointmentPatch } from "../../domain/repositories";
import { getFilterUnitId } from "../unitFilter";

function canManageAppointments(auth: AuthContext) {
  return auth.roles.includes("ORG_ADMIN") || auth.roles.includes("MEMBER");
}

function canReadAppointments(auth: AuthContext) {
  return auth.roles.includes("ORG_ADMIN") || auth.roles.includes("DOCTOR") || auth.roles.includes("MEMBER");
}

export { getFilterUnitId } from "../unitFilter";

export class AppointmentService {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly patients: PatientRepository,
    private readonly doctors: DoctorRepository,
  ) {}

  async list(auth: AuthContext, requestUnitId?: string | null) {
    if (!canReadAppointments(auth)) throw new ForbiddenError();
    const filterUnitId = getFilterUnitId(auth, requestUnitId);
    return this.appointments.listByOrganization(auth.organizationId, filterUnitId);
  }

  async create(auth: AuthContext, input: Omit<CreateAppointmentInput, "organizationId">) {
    if (!canManageAppointments(auth)) throw new ForbiddenError();
    const patient = await this.patients.findById(input.patientId);
    if (!patient || patient.organizationId !== auth.organizationId) throw new NotFoundError("Paciente não encontrado");
    if (patient.unitId && patient.unitId !== auth.unitId) throw new NotFoundError("Paciente não encontrado");
    const doctor = await this.doctors.findById(input.doctorId);
    if (!doctor || doctor.organizationId !== auth.organizationId) throw new NotFoundError("Médico não encontrado");
    return this.appointments.create({
      ...input,
      organizationId: auth.organizationId,
      unitId: auth.unitId,
      workflowStatus: input.workflowStatus ?? "RECEPCAO",
    });
  }

  async update(auth: AuthContext, appointmentId: string, patch: UpdateAppointmentPatch) {
    if (!canManageAppointments(auth)) throw new ForbiddenError();
    const existing = await this.appointments.findById(appointmentId);
    if (!existing || existing.organizationId !== auth.organizationId) throw new NotFoundError("Agendamento não encontrado");
    return this.appointments.update(appointmentId, patch);
  }

  async delete(auth: AuthContext, appointmentId: string) {
    if (!canManageAppointments(auth)) throw new ForbiddenError();
    const existing = await this.appointments.findById(appointmentId);
    if (!existing || existing.organizationId !== auth.organizationId) throw new NotFoundError("Agendamento não encontrado");
    await this.appointments.delete(appointmentId);
  }
}
