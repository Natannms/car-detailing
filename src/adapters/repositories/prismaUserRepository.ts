import type { PrismaClient } from "@prisma/client";
import type { CreateUserInput, UserRepository } from "../../domain/repositories";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  private map(raw: any) {
    return {
      id: raw.id,
      organizationId: raw.organizationId,
      unitId: raw.unitId ?? null,
      email: raw.email,
      passwordHash: raw.passwordHash ?? null,
      firebaseUid: raw.firebaseUid ?? null,
      roles: raw.roles ?? [],
    };
  }

  async create(input: CreateUserInput) {
    const created = await this.db.user.create({
      data: {
        organizationId: input.organizationId,
        email: input.email,
        passwordHash: input.passwordHash ?? null,
        firebaseUid: input.firebaseUid ?? null,
        roles: input.roles as any,
      } as any,
    });
    return this.map(created);
  }

  async findById(id: string) {
    const u = await this.db.user.findUnique({ where: { id } });
    return u ? this.map(u) : null;
  }

  async findByEmail(email: string) {
    const u = await this.db.user.findUnique({ where: { email } });
    return u ? this.map(u) : null;
  }

  async findByFirebaseUid(firebaseUid: string) {
    const u = await this.db.user.findUnique({ where: { firebaseUid } });
    return u ? this.map(u) : null;
  }

  async attachFirebaseUid(id: string, firebaseUid: string) {
    const u = await this.db.user.update({ where: { id }, data: { firebaseUid } });
    return this.map(u);
  }

  async update(id: string, patch: Partial<{ organizationId: string; roles: ("ORG_ADMIN" | "MEMBER" | "DOCTOR")[]; unitId: string | null }>) {
    const { unitId: _unitId, ...rest } = patch;
    const u = await this.db.user.update({ where: { id }, data: rest as any });
    return this.map(u);
  }

  async listByOrganization(organizationId: string) {
    const list = await this.db.user.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } });
    return list.map(u => this.map(u));
  }
}
