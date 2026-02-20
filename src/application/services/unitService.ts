import type { AuthContext } from "../../domain/entities";
import { ForbiddenError, NotFoundError } from "../../domain/errors";
import type { OrganizationBillingRepository, UnitRepository, UserRepository } from "../../domain/repositories";
import { getFilterUnitId } from "../unitFilter";

function canManageUnits(auth: AuthContext) {
  return auth.roles.includes("ORG_ADMIN");
}

export class UnitService {
  constructor(
    private readonly units: UnitRepository,
    private readonly users: UserRepository,
    private readonly billing: OrganizationBillingRepository,
  ) {}

  async list(auth: AuthContext, requestUnitId?: string | null) {
    const list = await this.units.listByOrganization(auth.organizationId);
    const filterUnitId = getFilterUnitId(auth, requestUnitId);
    if (filterUnitId == null) return { units: list };
    return { units: list.filter(u => u.id === filterUnitId) };
  }

  async create(auth: AuthContext, input: { name: string; phone?: string | null; address?: string | null }) {
    if (!canManageUnits(auth)) throw new ForbiddenError();

    const b = await this.billing.getByOrganizationId(auth.organizationId);
    const planId = b?.planId ?? "basic";
    
    const currentCount = await this.units.countByOrganization(auth.organizationId);
    let maxUnits: number | null = null;
    
    if (planId === "basic") maxUnits = 1;
    else if (planId === "premium") maxUnits = 6;
    
    if (typeof maxUnits === "number" && currentCount >= maxUnits) {
      throw new ForbiddenError("Limite de unidades atingido para o seu plano");
    }

    const unit = await this.units.create({
      organizationId: auth.organizationId,
      name: input.name,
      phone: input.phone ?? null,
      address: input.address ?? null,
    });

    return { unit };
  }

  async setCurrentUnit(auth: AuthContext, unitId: string) {
    if (!canManageUnits(auth)) throw new ForbiddenError();
    const unit = await this.units.findById(unitId);
    if (!unit || unit.organizationId !== auth.organizationId) throw new NotFoundError("Unidade não encontrada");
    const user = await this.users.update(auth.userId, { unitId: unit.id });
    return { user };
  }
}

