import { randomUUID } from "crypto";
import type { UnitRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../infrastructure/firebase/converters";

export class FirebaseUnitRepository implements UnitRepository {
  private col() {
    return firestore().collection("units");
  }

  private map(raw: any) {
    return {
      id: raw.id,
      organizationId: raw.organizationId,
      name: raw.name,
      phone: raw.phone ?? null,
      address: raw.address ?? null,
      createdAt: fromFirestoreDate(raw.createdAt) ?? new Date(),
      updatedAt: fromFirestoreDate(raw.updatedAt) ?? new Date(),
      deletedAt: fromFirestoreDate(raw.deletedAt),
    };
  }

  async create(input: any) {
    const id = randomUUID();
    const now = new Date();
    const doc = {
      id,
      organizationId: input.organizationId,
      name: input.name,
      phone: input.phone ?? null,
      address: input.address ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await this.col().doc(id).set(doc);
    return this.map(doc);
  }

  async update(id: string, patch: any) {
    await this.col().doc(id).update({ ...patch, updatedAt: new Date() });
    const u = await this.findById(id);
    if (!u) throw new Error("Unidade não encontrada");
    return u;
  }

  async delete(id: string) {
    await this.col().doc(id).update({ deletedAt: new Date(), updatedAt: new Date() });
  }

  async findById(id: string) {
    const snap = await this.col().doc(id).get();
    if (!snap.exists) return null;
    const d = snap.data() as any;
    return this.map({ ...d, id: d.id ?? snap.id });
  }

  async listByOrganization(organizationId: string) {
    const snap = await this.col().where("organizationId", "==", organizationId).get();
    const items = snap.docs.map(d => this.map({ ...(d.data() as any), id: (d.data() as any)?.id ?? d.id })).filter(u => !u.deletedAt);
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }

  async countByOrganization(organizationId: string) {
    const items = await this.listByOrganization(organizationId);
    return items.length;
  }
}

