import type { AsaasPaymentRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../infrastructure/firebase/converters";

export class FirebaseAsaasPaymentRepository implements AsaasPaymentRepository {
  private col() {
    return firestore().collection("asaasPayments");
  }

  private map(raw: any) {
    return {
      organizationId: raw.organizationId,
      paymentId: raw.paymentId,
      subscriptionId: raw.subscriptionId ?? null,
      customerId: raw.customerId ?? null,
      status: raw.status,
      value: typeof raw.value === "number" ? raw.value : null,
      dueDate: fromFirestoreDate(raw.dueDate),
      invoiceUrl: raw.invoiceUrl ?? null,
      billingType: raw.billingType ?? null,
      raw: raw.raw ?? null,
      createdAt: fromFirestoreDate(raw.createdAt) ?? new Date(),
      updatedAt: fromFirestoreDate(raw.updatedAt) ?? new Date(),
    };
  }

  async upsert(paymentId: string, input: any) {
    const now = new Date();
    const ref = this.col().doc(paymentId);
    const existing = await ref.get();
    if (!existing.exists) {
      const doc = { ...input, paymentId, createdAt: now, updatedAt: now };
      await ref.set(doc);
      return this.map(doc);
    }

    await ref.set({ ...input, paymentId, updatedAt: now }, { merge: true });
    const fresh = await ref.get();
    const d = fresh.data() as any;
    return this.map({ ...d, paymentId: d.paymentId ?? fresh.id });
  }

  async listByOrganization(organizationId: string, limit = 50) {
    const snap = await this.col().where("organizationId", "==", organizationId).get();
    const items = snap.docs.map(d => this.map({ ...(d.data() as any), paymentId: (d.data() as any)?.paymentId ?? d.id }));
    items.sort((a, b) => (b.dueDate?.getTime() ?? 0) - (a.dueDate?.getTime() ?? 0));
    return items.slice(0, limit);
  }
}

