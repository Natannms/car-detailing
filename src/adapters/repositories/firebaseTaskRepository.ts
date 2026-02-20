import { randomUUID } from "crypto";
import type { TaskRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";

export class FirebaseTaskRepository implements TaskRepository {
  private col() {
    return firestore().collection("tasks");
  }

  private map(raw: any) {
    return {
      id: raw.id,
      storyId: raw.storyId,
      title: raw.title,
      description: raw.description ?? null,
      status: raw.status ?? "TODO",
    };
  }

  async create(input: any) {
    const id = randomUUID();
    const doc = {
      id,
      storyId: input.storyId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "TODO",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.col().doc(id).set(doc);
    return this.map(doc);
  }

  async update(id: string, patch: any) {
    await this.col().doc(id).update({ ...patch, updatedAt: new Date() });
    const task = await this.findById(id);
    if (!task) throw new Error("Task não encontrada");
    return task;
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

  async findByStoryAndTitle(storyId: string, title: string) {
    const snap = await this.col().where("storyId", "==", storyId).where("title", "==", title).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    const d = doc.data() as any;
    return this.map({ ...d, id: d.id ?? doc.id });
  }

  async listByStory(storyId: string) {
    const snap = await this.col().where("storyId", "==", storyId).orderBy("createdAt", "asc").get();
    return snap.docs.map(d => this.map({ ...(d.data() as any), id: (d.data() as any)?.id ?? d.id }));
  }
}

