import { randomUUID } from "crypto";
import type { PatientRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../infrastructure/firebase/converters";

export class FirebasePatientRepository implements PatientRepository {
  private col() {
    return firestore().collection("patients");
  }

  private map(raw: any) {
    return {
      id: raw.id,
      organizationId: raw.organizationId,
      unitId: raw.unitId ?? null,
      patientNumber: raw.patientNumber,
      name: raw.name,
      email: raw.email ?? null,
      phone: raw.phone ?? null,
      gender: raw.gender ?? null,
      age: raw.age ?? null,
      bloodType: raw.bloodType ?? null,
      treatment: raw.treatment ?? null,
      cpf: raw.cpf ?? null,
      rg: raw.rg ?? null,
      address: raw.address ?? null,
      attendanceStatus: raw.attendanceStatus ?? null,
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
      patientNumber: input.patientNumber,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      gender: input.gender ?? null,
      age: input.age ?? null,
      bloodType: input.bloodType ?? null,
      treatment: input.treatment ?? null,
      cpf: input.cpf ?? null,
      rg: input.rg ?? null,
      address: input.address ?? null,
      attendanceStatus: input.attendanceStatus ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await this.col().doc(id).set(doc);
    return this.map(doc);
  }

  async update(id: string, patch: any) {
    await this.col().doc(id).update({ ...patch, updatedAt: new Date() });
    const p = await this.findById(id);
    if (!p) throw new Error("Paciente não encontrado");
    return p;
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
      .filter(p => !p.deletedAt);
    if (unitId != null && unitId !== "") {
      items = items.filter(p => p.unitId === unitId);
    }
    items.sort((a, b) => (a.patientNumber ?? "").localeCompare(b.patientNumber ?? "", undefined, { numeric: true }));
    return items;
  }

  async searchByOrganization(organizationId: string, query: string, unitId?: string | null) {
    const q = query.trim().toLowerCase();
    if (!q) return this.listByOrganization(organizationId, unitId);
    const all = await this.listByOrganization(organizationId, unitId);
    return all.filter(p => {
      const name = p.name.toLowerCase();
      const email = (p.email ?? "").toLowerCase();
      const phone = (p.phone ?? "").toLowerCase();
      const cpf = (p.cpf ?? "").toLowerCase();
      const rg = (p.rg ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || cpf.includes(q) || rg.includes(q);
    });
  }
}
