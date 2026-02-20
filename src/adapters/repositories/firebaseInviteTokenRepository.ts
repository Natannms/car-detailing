import { randomUUID } from "crypto";
import type { InviteTokenRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../infrastructure/firebase/converters";

type InviteDoc = {
  id: string;
  organizationId: string;
  tokenHash: string;
  roleToGrant: "ORG_ADMIN" | "MEMBER" | "DOCTOR";
  emailHint: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  usedByUserId: string | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

export class FirebaseInviteTokenRepository implements InviteTokenRepository {
  private col() {
    return firestore().collection("inviteTokens");
  }

  private map(raw: any) {
    return {
      id: raw.id,
      organizationId: raw.organizationId,
      tokenHash: raw.tokenHash,
      roleToGrant: raw.roleToGrant,
      emailHint: raw.emailHint ?? null,
      expiresAt: fromFirestoreDate(raw.expiresAt) ?? new Date(),
      usedAt: fromFirestoreDate(raw.usedAt),
      usedByUserId: raw.usedByUserId ?? null,
      createdByUserId: raw.createdByUserId,
    };
  }

  async create(input: { organizationId: string; tokenHash: string; roleToGrant: any; emailHint?: string | null; expiresAt: Date; createdByUserId: string }) {
    const id = randomUUID();
    const now = new Date();
    const doc: InviteDoc = {
      id,
      organizationId: input.organizationId,
      tokenHash: input.tokenHash,
      roleToGrant: input.roleToGrant,
      emailHint: input.emailHint ?? null,
      expiresAt: input.expiresAt,
      usedAt: null,
      usedByUserId: null,
      createdByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
    };
    await this.col().doc(id).set(doc);
    return this.map(doc);
  }

  async findByTokenHash(tokenHash: string) {
    const snap = await this.col().where("tokenHash", "==", tokenHash).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    return this.map({ ...(doc.data() as any), id: (doc.data() as any)?.id ?? doc.id });
  }

  async markUsed(id: string, usedAt: Date, usedByUserId: string) {
    await this.col().doc(id).update({ usedAt, usedByUserId, updatedAt: new Date() });
  }

  async listByOrganization(organizationId: string) {
    const snap = await this.col().where("organizationId", "==", organizationId).get();
    return snap.docs.map(d => this.map({ ...(d.data() as any), id: (d.data() as any)?.id ?? d.id }));
  }

  async revoke(id: string) {
    await this.col().doc(id).delete();
  }
}
