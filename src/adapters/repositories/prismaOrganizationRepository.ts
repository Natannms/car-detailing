import type { PrismaClient } from "@prisma/client";
import type { OrganizationRepository } from "../../domain/repositories";

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: { name: string }) {
    return this.db.organization.create({ data: input });
  }

  async findById(id: string) {
    return this.db.organization.findUnique({ where: { id } });
  }

  async findByName(name: string) {
    return this.db.organization.findFirst({ where: { name } });
  }
}
