import type { PrismaClient } from "@prisma/client";
import type { UserRepository } from "../../domain/repositories";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: {
    organizationId: string;
    email: string;
    passwordHash?: string | null;
    clerkUserId?: string | null;
    roles: ("ORG_ADMIN" | "MEMBER")[];
  }) {
    return this.db.user.create({ data: input });
  }

  async findById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  async findByClerkUserId(clerkUserId: string) {
    return this.db.user.findUnique({ where: { clerkUserId } });
  }

  async attachClerkUserId(id: string, clerkUserId: string) {
    return this.db.user.update({ where: { id }, data: { clerkUserId } });
  }

  async listByOrganization(organizationId: string) {
    return this.db.user.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } });
  }
}
