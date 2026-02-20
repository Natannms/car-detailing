import type { WebhookEventRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../infrastructure/firebase/converters";

export class FirebaseWebhookEventRepository implements WebhookEventRepository {
  private col() {
    return firestore().collection("asaasWebhookEvents");
  }

  async exists(eventId: string) {
    const snap = await this.col().doc(eventId).get();
    return snap.exists;
  }

  async markReceived(eventId: string, type: string, raw: Record<string, unknown>) {
    const ref = this.col().doc(eventId);
    const now = new Date();
    await ref.set(
      {
        eventId,
        type,
        raw,
        receivedAt: now,
        processedAt: null,
        updatedAt: now,
      },
      { merge: true },
    );
  }

  async markProcessed(eventId: string, processedAt: Date) {
    const ref = this.col().doc(eventId);
    const existing = await ref.get();
    if (!existing.exists) {
      await ref.set({ eventId, processedAt, receivedAt: processedAt, updatedAt: processedAt }, { merge: true });
      return;
    }
    const d = existing.data() as any;
    const already = fromFirestoreDate(d.processedAt);
    if (already) return;
    await ref.set({ processedAt, updatedAt: new Date() }, { merge: true });
  }
}

