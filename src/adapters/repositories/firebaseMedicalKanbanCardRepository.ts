import { randomUUID } from "crypto";
import type { MedicalKanbanCardRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../infrastructure/firebase/converters";

export class FirebaseMedicalKanbanCardRepository implements MedicalKanbanCardRepository {
  private col() {
    return firestore().collection("kanbanCards");
  }

  private map(raw: any) {
    return {
      id: raw.id,
      organizationId: raw.organizationId,
      unitId: raw.unitId ?? null,
      patientId: raw.patientId ?? null,
      clientName: raw.clientName,
      clientPhone: raw.clientPhone,
      urgency: raw.urgency,
      status: raw.status,
      createdAt: fromFirestoreDate(raw.createdAt) ?? new Date(),
      updatedAt: fromFirestoreDate(raw.updatedAt) ?? new Date(),
    };
  }

  async create(input: any) {
    const id = randomUUID();
    const now = new Date();
    const doc = {
      id,
      organizationId: input.organizationId,
      unitId: input.unitId ?? null,
      patientId: input.patientId ?? null,
      clientName: input.clientName,
      clientPhone: input.clientPhone,
      urgency: input.urgency,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };
    await this.col().doc(id).set(doc);
    return this.map(doc);
  }

  async update(id: string, patch: any) {
    await this.col().doc(id).update({ ...patch, updatedAt: new Date() });
    const c = await this.findById(id);
    if (!c) throw new Error("Card não encontrado");
    return c;
  }

  async delete(id: string) {
    await this.col().doc(id).delete();
  }

  async findById(id: string) {
    const snap = await this.col().doc(id).get();
    if (!snap.exists) return null;
    const d = snap.data() as any;
    return this.map({ ...d, id: d.id ?? snap.id });
  }

  async listByOrganization(organizationId: string, unitId?: string | null) {
    const snap = await this.col().where("organizationId", "==", organizationId).get();
    let items = snap.docs.map(d => this.map({ ...(d.data() as any), id: (d.data() as any)?.id ?? d.id }));
    if (unitId != null && unitId !== "") {
      items = items.filter(c => c.unitId === unitId);
    }
    items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return items;
  }
}
