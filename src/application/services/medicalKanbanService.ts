import type { AuthContext, MedicalKanbanColumnName } from "../../domain/entities";
import { ForbiddenError, NotFoundError } from "../../domain/errors";
import type { CreateMedicalKanbanCardInput, MedicalKanbanCardRepository, PatientRepository, UpdateMedicalKanbanCardPatch } from "../../domain/repositories";
import { getFilterUnitId } from "../unitFilter";

const allowedStatuses: MedicalKanbanColumnName[] = ["Agente", "Aguardando atendimento", "Em atendimento", "Finalizado"];

function canRead(auth: AuthContext) {
  return auth.roles.includes("ORG_ADMIN") || auth.roles.includes("DOCTOR") || auth.roles.includes("MEMBER");
}

function canManage(auth: AuthContext) {
  return auth.roles.includes("ORG_ADMIN") || auth.roles.includes("DOCTOR");
}

export class MedicalKanbanService {
  constructor(
    private readonly cards: MedicalKanbanCardRepository,
    private readonly patients: PatientRepository,
  ) {}

  statuses() {
    return allowedStatuses;
  }

  async list(auth: AuthContext, requestUnitId?: string | null) {
    if (!canRead(auth)) throw new ForbiddenError();
    const filterUnitId = getFilterUnitId(auth, requestUnitId);
    return this.cards.listByOrganization(auth.organizationId, filterUnitId);
  }

  async create(auth: AuthContext, input: Omit<CreateMedicalKanbanCardInput, "organizationId">) {
    if (!canManage(auth)) throw new ForbiddenError();
    if (!allowedStatuses.includes(input.status)) throw new ForbiddenError();
    const patientId = input.patientId ?? null;
    if (patientId) {
      const p = await this.patients.findById(patientId);
      if (!p || p.organizationId !== auth.organizationId) throw new NotFoundError("Paciente não encontrado");
      if (p.unitId && p.unitId !== auth.unitId) throw new NotFoundError("Paciente não encontrado");
    }
    return this.cards.create({ ...input, organizationId: auth.organizationId, unitId: auth.unitId, patientId });
  }

  async update(auth: AuthContext, cardId: string, patch: UpdateMedicalKanbanCardPatch) {
    if (!canManage(auth)) throw new ForbiddenError();
    const existing = await this.cards.findById(cardId);
    if (!existing || existing.organizationId !== auth.organizationId) throw new NotFoundError("Card não encontrado");
    if (!auth.roles.includes("ORG_ADMIN") && existing.unitId && existing.unitId !== auth.unitId) throw new NotFoundError("Card não encontrado");
    if (patch.status && !allowedStatuses.includes(patch.status)) throw new ForbiddenError();
    return this.cards.update(cardId, patch);
  }

  async delete(auth: AuthContext, cardId: string) {
    if (!canManage(auth)) throw new ForbiddenError();
    const existing = await this.cards.findById(cardId);
    if (!existing || existing.organizationId !== auth.organizationId) throw new NotFoundError("Card não encontrado");
    if (!auth.roles.includes("ORG_ADMIN") && existing.unitId && existing.unitId !== auth.unitId) throw new NotFoundError("Card não encontrado");
    await this.cards.delete(cardId);
  }
}
