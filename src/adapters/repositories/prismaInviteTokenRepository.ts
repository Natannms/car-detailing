import type { PrismaClient } from "@prisma/client";
import type { InviteTokenRepository } from "../../domain/repositories";

export class PrismaInviteTokenRepository implements InviteTokenRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: { organizationId: string; tokenHash: string; emailHint?: string | null; expiresAt: Date; createdByUserId: string }) {
    return this.db.inviteToken.create({
      data: {
        organizationId: input.organizationId,
        tokenHash: input.tokenHash,
        emailHint: input.emailHint ?? null,
        expiresAt: input.expiresAt,
        createdByUserId: input.createdByUserId,
        roleToGrant: "MEMBER",
      },
    });
  }

  async findByTokenHash(tokenHash: string) {
    return this.db.inviteToken.findUnique({ where: { tokenHash } });
  }

  async markUsed(id: string, usedAt: Date, usedByUserId: string) {
    await this.db.inviteToken.update({
      where: { id },
      data: {
        usedAt,
        usedByUserId,
      },
    });
  }

  async listByOrganization(organizationId: string) {
    return this.db.inviteToken.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async revoke(id: string) {
    await this.db.inviteToken.delete({ where: { id } });
  }
}

