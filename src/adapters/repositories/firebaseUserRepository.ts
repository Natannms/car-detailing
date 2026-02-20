import { randomUUID } from "crypto";
import type { UserRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";

type UserDoc = {
  id: string;
  organizationId: string;
  unitId: string | null;
  email: string;
  passwordHash: string | null;
  firebaseUid: string | null;
  roles: ("ORG_ADMIN" | "MEMBER" | "DOCTOR")[];
  createdAt: Date;
  updatedAt: Date;
};

export class FirebaseUserRepository implements UserRepository {
  private col() {
    return firestore().collection("users");
  }

  private map(doc: any) {
    return {
      id: doc.id,
      organizationId: doc.organizationId,
      unitId: doc.unitId ?? null,
      email: doc.email,
      passwordHash: doc.passwordHash ?? null,
      firebaseUid: doc.firebaseUid ?? null,
      roles: doc.roles ?? [],
    };
  }

  async create(input: {
    organizationId: string;
    unitId?: string | null;
    email: string;
    passwordHash?: string | null;
    firebaseUid?: string | null;
    roles: ("ORG_ADMIN" | "MEMBER" | "DOCTOR")[];
  }) {
    const id = randomUUID();
    const now = new Date();
    const doc: UserDoc = {
      id,
      organizationId: input.organizationId,
      unitId: input.unitId ?? null,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash ?? null,
      firebaseUid: input.firebaseUid ?? null,
      roles: input.roles as any,
      createdAt: now,
      updatedAt: now,
    };
    await this.col().doc(id).set(doc);
    return this.map(doc);
  }

  async findById(id: string) {
    const snap = await this.col().doc(id).get();
    if (!snap.exists) return null;
    return this.map({ ...(snap.data() as any), id: (snap.data() as any)?.id ?? snap.id });
  }

  async findByEmail(email: string) {
    const snap = await this.col().where("email", "==", email.toLowerCase()).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    return this.map({ ...(doc.data() as any), id: (doc.data() as any)?.id ?? doc.id });
  }

  async findByFirebaseUid(firebaseUid: string) {
    const snap = await this.col().where("firebaseUid", "==", firebaseUid).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    return this.map({ ...(doc.data() as any), id: (doc.data() as any)?.id ?? doc.id });
  }

  async attachFirebaseUid(id: string, firebaseUid: string) {
    const now = new Date();
    await this.col().doc(id).update({ firebaseUid, updatedAt: now });
    const user = await this.findById(id);
    if (!user) throw new Error("User não encontrado");
    return user;
  }

  async update(id: string, patch: Partial<{ organizationId: string; roles: ("ORG_ADMIN" | "MEMBER" | "DOCTOR")[]; unitId: string | null }>) {
    await this.col().doc(id).update({ ...patch, updatedAt: new Date() });
    const user = await this.findById(id);
    if (!user) throw new Error("User não encontrado");
    return user;
  }

  async listByOrganization(organizationId: string) {
    const snap = await this.col().where("organizationId", "==", organizationId).get();
    return snap.docs.map(d => this.map({ ...(d.data() as any), id: (d.data() as any)?.id ?? d.id }));
  }
}
