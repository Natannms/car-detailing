import type { PrismaClient } from "@prisma/client";
import type { ClientRepository } from "../../domain/repositories";

export class PrismaClientRepository implements ClientRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: any) {
    return this.db.client.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        code: input.code ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        instagram: input.instagram ?? null,
        linkedin: input.linkedin ?? null,
        companyName: input.companyName ?? null,
        notes: input.notes ?? null,
      },
    });
  }

  async findById(id: string) {
    return this.db.client.findUnique({ where: { id } });
  }

  async findByOrgAndName(organizationId: string, name: string) {
    return this.db.client.findUnique({
      where: {
        organizationId_name: { organizationId, name },
      },
    });
  }

  async findByOrgAndCode(organizationId: string, code: string) {
    return this.db.client.findUnique({
      where: {
        organizationId_code: { organizationId, code },
      },
    });
  }

  async listByOrganization(organizationId: string) {
    return this.db.client.findMany({ where: { organizationId }, orderBy: { name: "asc" } });
  }
}
