import { randomUUID } from "crypto";
import type { TaskBoardColumnRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";

export class FirebaseTaskBoardColumnRepository implements TaskBoardColumnRepository {
  private col() {
    return firestore().collection("taskBoardColumns");
  }

  async create(input: { storyId: string; name: string; order: number }) {
    const id = randomUUID();
    const doc = {
      id,
      storyId: input.storyId,
      name: input.name,
      order: input.order,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.col().doc(id).set(doc);
    return { id: doc.id, storyId: doc.storyId, name: doc.name, order: doc.order };
  }

  async update(id: string, patch: Partial<{ name: string; order: number }>) {
    await this.col().doc(id).update({ ...patch, updatedAt: new Date() });
    const col = await this.findById(id);
    if (!col) throw new Error("Coluna não encontrada");
    return col;
  }

  async delete(id: string) {
    await this.col().doc(id).delete();
  }

  async findById(id: string) {
    const snap = await this.col().doc(id).get();
    if (!snap.exists) return null;
    const d = snap.data() as any;
    return { id: d.id ?? snap.id, storyId: d.storyId, name: d.name, order: d.order };
  }

  async findByStoryAndName(storyId: string, name: string) {
    const snap = await this.col().where("storyId", "==", storyId).where("name", "==", name).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    const d = doc.data() as any;
    return { id: d.id ?? doc.id, storyId: d.storyId, name: d.name, order: d.order };
  }

  async listByStory(storyId: string) {
    const snap = await this.col().where("storyId", "==", storyId).orderBy("order", "asc").get();
    return snap.docs.map(d => {
      const raw = d.data() as any;
      return { id: raw.id ?? d.id, storyId: raw.storyId, name: raw.name, order: raw.order };
    });
  }
}

