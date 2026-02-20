import { randomUUID } from "crypto";
import type { ClientRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";

export class FirebaseClientRepository implements ClientRepository {
  private col() {
    return firestore().collection("clients");
  }

  private map(raw: any) {
    return {
      id: raw.id,
      organizationId: raw.organizationId,
      name: raw.name,
      code: raw.code ?? null,
      email: raw.email ?? null,
      phone: raw.phone ?? null,
      address: raw.address ?? null,
      instagram: raw.instagram ?? null,
      linkedin: raw.linkedin ?? null,
      companyName: raw.companyName ?? null,
      notes: raw.notes ?? null,
    };
  }

  async create(input: any) {
    const id = randomUUID();
    const now = new Date();
    const doc = {
      id,
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
      createdAt: now,
      updatedAt: now,
    };
    await this.col().doc(id).set(doc);
    return this.map(doc);
  }

  async findById(id: string) {
    const snap = await this.col().doc(id).get();
    if (!snap.exists) return null;
    const d = snap.data() as any;
    return this.map({ ...d, id: d.id ?? snap.id });
  }

  async findByOrgAndName(organizationId: string, name: string) {
    const snap = await this.col().where("organizationId", "==", organizationId).where("name", "==", name).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    const d = doc.data() as any;
    return this.map({ ...d, id: d.id ?? doc.id });
  }

  async findByOrgAndCode(organizationId: string, code: string) {
    const snap = await this.col().where("organizationId", "==", organizationId).where("code", "==", code).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    const d = doc.data() as any;
    return this.map({ ...d, id: d.id ?? doc.id });
  }

  async listByOrganization(organizationId: string) {
    const snap = await this.col().where("organizationId", "==", organizationId).orderBy("name", "asc").get();
    return snap.docs.map(d => this.map({ ...(d.data() as any), id: (d.data() as any)?.id ?? d.id }));
  }
}

