import { randomUUID } from "crypto";
import type { AppointmentRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../infrastructure/firebase/converters";

export class FirebaseAppointmentRepository implements AppointmentRepository {
  private col() {
    return firestore().collection("appointments");
  }

  private map(raw: any) {
    return {
      id: raw.id,
      organizationId: raw.organizationId,
      unitId: raw.unitId ?? null,
      patientId: raw.patientId,
      doctorId: raw.doctorId,
      scheduledAt: fromFirestoreDate(raw.scheduledAt) ?? new Date(),
      status: raw.status,
      workflowStatus: raw.workflowStatus ?? "AGUARDANDO",
      notes: raw.notes ?? null,
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
      patientId: input.patientId,
      doctorId: input.doctorId,
      scheduledAt: input.scheduledAt,
      status: input.status,
      workflowStatus: input.workflowStatus ?? "RECEPCAO",
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await this.col().doc(id).set(doc);
    return this.map(doc);
  }

  async update(id: string, patch: any) {
    await this.col().doc(id).update({ ...patch, updatedAt: new Date() });
    const a = await this.findById(id);
    if (!a) throw new Error("Agendamento não encontrado");
    return a;
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

  async listByOrganization(organizationId: string, unitId?: string | null) {
    const snap = await this.col().where("organizationId", "==", organizationId).get();
    let items = snap.docs
      .map(d => this.map({ ...(d.data() as any), id: (d.data() as any)?.id ?? d.id }))
      .filter(a => !a.deletedAt);
    if (unitId != null && unitId !== "") {
      items = items.filter(a => a.unitId === unitId);
    }
    items.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
    return items;
  }
}
