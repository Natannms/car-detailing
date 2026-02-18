import type { AuthContext } from "../../domain/entities";
import { ConflictError, ForbiddenError } from "../../domain/errors";
import type { ClientRepository, CreateClientInput } from "../../domain/repositories";

export class ClientService {
  constructor(private readonly clients: ClientRepository) {}

  async create(auth: AuthContext, input: Omit<CreateClientInput, "organizationId">) {
    if (!auth.roles.includes("ORG_ADMIN")) throw new ForbiddenError();

    const name = input.name.trim();
    if (!name) throw new ConflictError("Nome inválido");

    const existingByName = await this.clients.findByOrgAndName(auth.organizationId, name);
    if (existingByName) throw new ConflictError("Cliente já existe");

    const code = input.code?.trim() || null;
    if (code) {
      const existingByCode = await this.clients.findByOrgAndCode(auth.organizationId, code);
      if (existingByCode) throw new ConflictError("Código de cliente já existe");
    }

    const normalize = (v: string | null | undefined) => (v?.trim() ? v.trim() : null);

    return this.clients.create({
      organizationId: auth.organizationId,
      name,
      code,
      email: normalize(input.email),
      phone: normalize(input.phone),
      address: normalize(input.address),
      instagram: normalize(input.instagram),
      linkedin: normalize(input.linkedin),
      companyName: normalize(input.companyName),
      notes: normalize(input.notes),
    });
  }

  async list(auth: AuthContext) {
    return this.clients.listByOrganization(auth.organizationId);
  }
}
