import { randomUUID } from "crypto";
import type { OrganizationRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../infrastructure/firebase/converters";

type OrganizationDoc = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export class FirebaseOrganizationRepository implements OrganizationRepository {
  private col() {
    return firestore().collection("organizations");
  }

  async create(input: { name: string }) {
    const id = randomUUID();
    const now = new Date();
    const doc: OrganizationDoc = { id, name: input.name, createdAt: now, updatedAt: now };
    await this.col().doc(id).set(doc);
    return doc;
  }

  async findById(id: string) {
    const snap = await this.col().doc(id).get();
    if (!snap.exists) return null;
    const d = snap.data() as any;
    return {
      id: d.id ?? snap.id,
      name: d.name,
      createdAt: fromFirestoreDate(d.createdAt) ?? new Date(),
      updatedAt: fromFirestoreDate(d.updatedAt) ?? new Date(),
    };
  }

  async findByName(name: string) {
    const snap = await this.col().where("name", "==", name).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    const d = doc.data() as any;
    return {
      id: d.id ?? doc.id,
      name: d.name,
      createdAt: fromFirestoreDate(d.createdAt) ?? new Date(),
      updatedAt: fromFirestoreDate(d.updatedAt) ?? new Date(),
    };
  }
}
