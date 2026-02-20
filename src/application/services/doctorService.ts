import type { AuthContext } from "../../domain/entities";
import { ConflictError, ForbiddenError, NotFoundError } from "../../domain/errors";
import type { CreateDoctorInput, DoctorRepository, UpdateDoctorPatch } from "../../domain/repositories";
import { getFilterUnitId } from "../unitFilter";

function canManageDoctors(auth: AuthContext) {
  return auth.roles.includes("ORG_ADMIN");
}

function canReadDoctors(auth: AuthContext) {
  return auth.roles.includes("ORG_ADMIN") || auth.roles.includes("DOCTOR");
}

export class DoctorService {
  constructor(private readonly doctors: DoctorRepository) {}

  async list(auth: AuthContext, requestUnitId?: string | null) {
    if (!canReadDoctors(auth)) throw new ForbiddenError();
    const filterUnitId = getFilterUnitId(auth, requestUnitId);
    return this.doctors.listByOrganization(auth.organizationId, filterUnitId);
  }

  async me(auth: AuthContext) {
    if (!auth.roles.includes("DOCTOR") && !auth.roles.includes("ORG_ADMIN")) throw new ForbiddenError();
    const doctor = await this.doctors.findByUserId(auth.userId);
    if (!doctor || doctor.organizationId !== auth.organizationId) throw new NotFoundError("Médico não encontrado");
    return doctor;
  }

  async updateMe(auth: AuthContext, patch: Pick<UpdateDoctorPatch, "name" | "phone" | "gender">) {
    if (!auth.roles.includes("DOCTOR") && !auth.roles.includes("ORG_ADMIN")) throw new ForbiddenError();
    const doctor = await this.doctors.findByUserId(auth.userId);
    if (!doctor || doctor.organizationId !== auth.organizationId) throw new NotFoundError("Médico não encontrado");
    return this.doctors.update(doctor.id, patch);
  }

  async create(auth: AuthContext, input: Omit<CreateDoctorInput, "organizationId">) {
    if (!canManageDoctors(auth)) throw new ForbiddenError();
    const email = input.email.trim().toLowerCase();
    const existing = await this.doctors.findByEmail(email);
    if (existing && existing.organizationId === auth.organizationId) throw new ConflictError("Médico já existe");
    return this.doctors.create({ ...input, organizationId: auth.organizationId, unitId: auth.unitId ?? null, email });
  }

  async update(auth: AuthContext, doctorId: string, patch: UpdateDoctorPatch) {
    if (!canManageDoctors(auth)) throw new ForbiddenError();
    const existing = await this.doctors.findById(doctorId);
    if (!existing || existing.organizationId !== auth.organizationId) throw new NotFoundError("Médico não encontrado");
    return this.doctors.update(doctorId, patch);
  }

  async delete(auth: AuthContext, doctorId: string) {
    if (!canManageDoctors(auth)) throw new ForbiddenError();
    const existing = await this.doctors.findById(doctorId);
    if (!existing || existing.organizationId !== auth.organizationId) throw new NotFoundError("Médico não encontrado");
    await this.doctors.delete(doctorId);
  }
}
