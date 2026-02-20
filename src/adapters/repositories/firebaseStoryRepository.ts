import { randomUUID } from "crypto";
import type { StoryRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";

export class FirebaseStoryRepository implements StoryRepository {
  private col() {
    return firestore().collection("stories");
  }

  private map(raw: any) {
    return {
      id: raw.id,
      epicId: raw.epicId,
      title: raw.title,
      userStory: raw.userStory,
      acceptanceCriteria: raw.acceptanceCriteria,
      status: raw.status ?? "TODO",
      points: raw.points ?? null,
    };
  }

  async create(input: any) {
    const id = randomUUID();
    const doc = {
      id,
      epicId: input.epicId,
      title: input.title,
      userStory: input.userStory,
      acceptanceCriteria: input.acceptanceCriteria,
      status: input.status ?? "TODO",
      points: input.points ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.col().doc(id).set(doc);
    return this.map(doc);
  }

  async update(id: string, patch: any) {
    await this.col().doc(id).update({ ...patch, updatedAt: new Date() });
    const story = await this.findById(id);
    if (!story) throw new Error("Story não encontrada");
    return story;
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

  async findByEpicAndTitle(epicId: string, title: string) {
    const snap = await this.col().where("epicId", "==", epicId).where("title", "==", title).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    const d = doc.data() as any;
    return this.map({ ...d, id: d.id ?? doc.id });
  }

  async listByEpic(epicId: string) {
    const snap = await this.col().where("epicId", "==", epicId).orderBy("createdAt", "asc").get();
    return snap.docs.map(d => this.map({ ...(d.data() as any), id: (d.data() as any)?.id ?? d.id }));
  }
}

