import { randomUUID } from "crypto";
import type { EpicRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";

export class FirebaseEpicRepository implements EpicRepository {
  private col() {
    return firestore().collection("epics");
  }

  private map(raw: any) {
    return {
      id: raw.id,
      projectId: raw.projectId,
      title: raw.title,
      context: raw.context ?? null,
      expected: raw.expected ?? null,
      status: raw.status ?? "TODO",
    };
  }

  async create(input: any) {
    const id = randomUUID();
    const doc = {
      id,
      projectId: input.projectId,
      title: input.title,
      context: input.context ?? null,
      expected: input.expected ?? null,
      status: input.status ?? "TODO",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.col().doc(id).set(doc);
    return this.map(doc);
  }

  async update(id: string, patch: any) {
    await this.col().doc(id).update({ ...patch, updatedAt: new Date() });
    const epic = await this.findById(id);
    if (!epic) throw new Error("Epic não encontrado");
    return epic;
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

  async findByProjectAndTitle(projectId: string, title: string) {
    const snap = await this.col().where("projectId", "==", projectId).where("title", "==", title).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    const d = doc.data() as any;
    return this.map({ ...d, id: d.id ?? doc.id });
  }

  async listByProject(projectId: string) {
    const snap = await this.col().where("projectId", "==", projectId).orderBy("createdAt", "asc").get();
    return snap.docs.map(d => this.map({ ...(d.data() as any), id: (d.data() as any)?.id ?? d.id }));
  }
}

