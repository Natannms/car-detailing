import type { OrganizationBillingRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../infrastructure/firebase/converters";

export class FirebaseOrganizationBillingRepository implements OrganizationBillingRepository {
  private col() {
    return firestore().collection("organizationBilling");
  }

  private map(raw: any) {
    return {
      organizationId: raw.organizationId,
      asaasCustomerId: raw.asaasCustomerId ?? null,
      asaasSubscriptionId: raw.asaasSubscriptionId ?? null,
      planId: raw.planId ?? null,
      billingType: raw.billingType ?? null,
      status: raw.status,
      validUntil: fromFirestoreDate(raw.validUntil),
      currentPaymentId: raw.currentPaymentId ?? null,
      currentInvoiceUrl: raw.currentInvoiceUrl ?? null,
      createdAt: fromFirestoreDate(raw.createdAt) ?? new Date(),
      updatedAt: fromFirestoreDate(raw.updatedAt) ?? new Date(),
    };
  }

  async getByOrganizationId(organizationId: string) {
    const snap = await this.col().doc(organizationId).get();
    if (!snap.exists) return null;
    const d = snap.data() as any;
    return this.map({ ...d, organizationId: d.organizationId ?? snap.id });
  }

  async upsert(organizationId: string, patch: any) {
    const now = new Date();
    const ref = this.col().doc(organizationId);
    const existing = await ref.get();
    if (!existing.exists) {
      const doc = {
        organizationId,
        asaasCustomerId: patch.asaasCustomerId ?? null,
        asaasSubscriptionId: patch.asaasSubscriptionId ?? null,
        planId: patch.planId ?? null,
        billingType: patch.billingType ?? null,
        status: patch.status ?? "PENDING",
        validUntil: patch.validUntil ?? null,
        currentPaymentId: patch.currentPaymentId ?? null,
        currentInvoiceUrl: patch.currentInvoiceUrl ?? null,
        createdAt: now,
        updatedAt: now,
      };
      await ref.set(doc);
      return this.map(doc);
    }

    await ref.set({ ...patch, updatedAt: now }, { merge: true });
    const fresh = await ref.get();
    const d = fresh.data() as any;
    return this.map({ ...d, organizationId: d.organizationId ?? fresh.id });
  }

  async findByAsaasSubscriptionId(asaasSubscriptionId: string) {
    const snap = await this.col().where("asaasSubscriptionId", "==", asaasSubscriptionId).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    const d = doc.data() as any;
    return this.map({ ...d, organizationId: d.organizationId ?? doc.id });
  }
}
