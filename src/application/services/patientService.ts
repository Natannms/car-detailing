import type { AuthContext } from "../../domain/entities";
import { ForbiddenError, NotFoundError } from "../../domain/errors";
import type { CreatePatientInput, PatientRepository, UpdatePatientPatch } from "../../domain/repositories";
import { getFilterUnitId } from "../unitFilter";

function canManagePatients(auth: AuthContext) {
  return auth.roles.includes("ORG_ADMIN");
}

function canReadPatients(auth: AuthContext) {
  return auth.roles.includes("ORG_ADMIN") || auth.roles.includes("DOCTOR") || auth.roles.includes("MEMBER");
}

export class PatientService {
  constructor(private readonly patients: PatientRepository) {}

  async list(auth: AuthContext, requestUnitId?: string | null) {
    if (!canReadPatients(auth)) throw new ForbiddenError();
    const filterUnitId = getFilterUnitId(auth, requestUnitId);
    return this.patients.listByOrganization(auth.organizationId, filterUnitId);
  }

  async search(auth: AuthContext, query: string, requestUnitId?: string | null) {
    if (!canReadPatients(auth)) throw new ForbiddenError();
    const filterUnitId = getFilterUnitId(auth, requestUnitId);
    return this.patients.searchByOrganization(auth.organizationId, query, filterUnitId);
  }

  async create(auth: AuthContext, input: Omit<CreatePatientInput, "organizationId" | "patientNumber">) {
    if (!canManagePatients(auth)) throw new ForbiddenError();

    const existing = await this.patients.listByOrganization(auth.organizationId);
    const next = existing.length + 1;
    const patientNumber = String(next).padStart(5, "0");

    return this.patients.create({
      organizationId: auth.organizationId,
      unitId: auth.unitId,
      patientNumber,
      ...input,
    });
  }

  async update(auth: AuthContext, patientId: string, patch: UpdatePatientPatch) {
    if (!canManagePatients(auth)) throw new ForbiddenError();
    const existing = await this.patients.findById(patientId);
    if (!existing || existing.organizationId !== auth.organizationId) throw new NotFoundError("Paciente não encontrado");
    return this.patients.update(patientId, patch);
  }

  async delete(auth: AuthContext, patientId: string) {
    if (!canManagePatients(auth)) throw new ForbiddenError();
    const existing = await this.patients.findById(patientId);
    if (!existing || existing.organizationId !== auth.organizationId) throw new NotFoundError("Paciente não encontrado");
    await this.patients.delete(patientId);
  }
}
