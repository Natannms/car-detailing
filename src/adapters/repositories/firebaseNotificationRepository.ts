import { randomUUID } from "crypto";
import type { NotificationRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../infrastructure/firebase/converters";

export class FirebaseNotificationRepository implements NotificationRepository {
  private col() {
    return firestore().collection("notifications");
  }

  private map(raw: any) {
    return {
      id: raw.id,
      organizationId: raw.organizationId,
      type: raw.type,
      appointmentId: raw.appointmentId ?? null,
      patientId: raw.patientId ?? null,
      doctorId: raw.doctorId ?? null,
      createdByUserId: raw.createdByUserId ?? null,
      payload: raw.payload ?? null,
      createdAt: fromFirestoreDate(raw.createdAt) ?? new Date(),
    };
  }

  async create(input: any) {
    const id = randomUUID();
    const now = new Date();
    const doc = {
      id,
      organizationId: input.organizationId,
      type: input.type,
      appointmentId: input.appointmentId ?? null,
      patientId: input.patientId ?? null,
      doctorId: input.doctorId ?? null,
      createdByUserId: input.createdByUserId ?? null,
      payload: input.payload ?? null,
      createdAt: now,
    };
    await this.col().doc(id).set(doc);
    return this.map(doc);
  }
}

