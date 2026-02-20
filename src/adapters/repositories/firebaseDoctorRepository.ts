import { randomUUID } from "crypto";
import type { DoctorRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../infrastructure/firebase/converters";

export class FirebaseDoctorRepository implements DoctorRepository {
  private col() {
    return firestore().collection("doctors");
  }

  private map(raw: any) {
    return {
      id: raw.id,
      organizationId: raw.organizationId,
      unitId: raw.unitId ?? null,
      userId: raw.userId ?? null,
      name: raw.name,
      email: raw.email,
      phone: raw.phone ?? null,
      gender: raw.gender ?? null,
      specialty: raw.specialty ?? null,
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
      unitId: input.unitId ?? null,
      userId: input.userId ?? null,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone ?? null,
      gender: input.gender ?? null,
      specialty: input.specialty ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await this.col().doc(id).set(doc);
    return this.map(doc);
  }

  async update(id: string, patch: any) {
    const toSave = { ...patch, updatedAt: new Date() };
    if (typeof toSave.email !== "undefined") delete toSave.email;
    await this.col().doc(id).update(toSave);
    const d = await this.findById(id);
    if (!d) throw new Error("Médico não encontrado");
    return d;
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

  async findByEmail(email: string) {
    const snap = await this.col().where("email", "==", email.toLowerCase()).limit(10).get();
    for (const doc of snap.docs) {
      const d = doc.data() as any;
      const mapped = this.map({ ...d, id: d.id ?? doc.id });
      if (!mapped.deletedAt) return mapped;
    }
    return null;
  }

  async findByUserId(userId: string) {
    const snap = await this.col().where("userId", "==", userId).limit(10).get();
    for (const doc of snap.docs) {
      const d = doc.data() as any;
      const mapped = this.map({ ...d, id: d.id ?? doc.id });
      if (!mapped.deletedAt) return mapped;
    }
    return null;
  }

  async listByOrganization(organizationId: string, unitId?: string | null) {
    const snap = await this.col().where("organizationId", "==", organizationId).get();
    let items = snap.docs
      .map(d => this.map({ ...(d.data() as any), id: (d.data() as any)?.id ?? d.id }))
      .filter(d => !d.deletedAt);
    if (unitId != null && unitId !== "") {
      items = items.filter(d => d.unitId === unitId);
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }
}
