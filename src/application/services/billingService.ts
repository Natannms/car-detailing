import type { AuthContext } from "../../domain/entities";
import { ForbiddenError, NotFoundError } from "../../domain/errors";
import type { AsaasPaymentRepository, OrganizationBillingRepository, WebhookEventRepository } from "../../domain/repositories";
import { AsaasClient } from "../../infrastructure/asaas/asaasClient";
import { firestore } from "../../infrastructure/firebase/admin";

function canManageBilling(auth: AuthContext) {
  return auth.roles.includes("ORG_ADMIN");
}

function yyyyMmDd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseAsaasDate(value: any) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00.000Z`);
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function addMonths(d: Date, months: number) {
  const copy = new Date(d.getTime());
  const day = copy.getUTCDate();
  copy.setUTCMonth(copy.getUTCMonth() + months);
  if (copy.getUTCDate() !== day) copy.setUTCDate(0);
  return copy;
}

export class BillingService {
  constructor(
    private readonly billing: OrganizationBillingRepository,
    private readonly payments: AsaasPaymentRepository,
    private readonly webhookEvents: WebhookEventRepository,
  ) {}

  async getStatus(auth: AuthContext) {
    const b = await this.billing.getByOrganizationId(auth.organizationId);
    return { billing: b };
  }

  async setup(auth: AuthContext, input: { customer: any; billingType: "PIX" | "CREDIT_CARD"; planId?: string | null }) {
    if (!canManageBilling(auth)) throw new ForbiddenError();
    const client = AsaasClient.fromEnv();

    let b = await this.billing.getByOrganizationId(auth.organizationId);
    if (!b) {
      b = await this.billing.upsert(auth.organizationId, { status: "PENDING" });
    }

    if (!b.asaasCustomerId) {
      const created = await client.createCustomer(input.customer);
      b = await this.billing.upsert(auth.organizationId, { asaasCustomerId: created.id });
    }

    if (!b.asaasSubscriptionId) {
      const planId = input.planId ?? b.planId ?? "basic";
      const planDoc = await firestore().collection("plans").doc(planId).get().catch(() => null);
      const plan = planDoc && planDoc.exists ? (planDoc.data() as any) : null;
      const value = typeof plan?.monthlyPrice === "number" ? plan.monthlyPrice : Number(process.env.ASAAS_SUBSCRIPTION_VALUE ?? "19.9");
      const name = typeof plan?.name === "string" ? plan.name : null;
      const description = ((process.env.ASAAS_SUBSCRIPTION_DESCRIPTION ?? "Assinatura") + (name ? ` ${name}` : "")).slice(0, 500);
      const created = await client.createSubscription({
        customer: b.asaasCustomerId!,
        billingType: input.billingType,
        nextDueDate: yyyyMmDd(new Date()),
        value,
        cycle: "MONTHLY",
        description,
        externalReference: auth.organizationId,
      });
      b = await this.billing.upsert(auth.organizationId, {
        asaasSubscriptionId: created.id,
        billingType: input.billingType,
        status: "PENDING",
        planId,
      });
    }

    const payments = await client.listSubscriptionPayments(b.asaasSubscriptionId!);
    const list = payments.data ?? [];
    list.sort((a, c) => {
      const da = parseAsaasDate(a?.dueDate)?.getTime() ?? 0;
      const db = parseAsaasDate(c?.dueDate)?.getTime() ?? 0;
      return db - da;
    });
    const first = list[0] ?? null;
    const invoiceUrl = first?.invoiceUrl ?? null;
    const paymentId = first?.id ?? null;
    if (paymentId || invoiceUrl) {
      b = await this.billing.upsert(auth.organizationId, { currentPaymentId: paymentId, currentInvoiceUrl: invoiceUrl });
    }

    return { billing: b, invoiceUrl: b.currentInvoiceUrl };
  }

  async refreshInvoice(auth: AuthContext) {
    if (!canManageBilling(auth)) throw new ForbiddenError();
    const b = await this.billing.getByOrganizationId(auth.organizationId);
    if (!b || !b.asaasSubscriptionId) throw new NotFoundError("Assinatura não encontrada");

    const client = AsaasClient.fromEnv();
    const payments = await client.listSubscriptionPayments(b.asaasSubscriptionId);
    const list = payments.data ?? [];
    const unpaid = list.filter(p => ["PENDING", "OVERDUE"].includes(String(p?.status ?? "").toUpperCase()));
    const pool = unpaid.length ? unpaid : list;
    pool.sort((a, c) => {
      const da = parseAsaasDate(a?.dueDate)?.getTime() ?? 0;
      const db = parseAsaasDate(c?.dueDate)?.getTime() ?? 0;
      return db - da;
    });
    const best = pool[0] ?? null;
    const invoiceUrl = best?.invoiceUrl ?? null;
    const paymentId = best?.id ?? null;
    const updated = await this.billing.upsert(auth.organizationId, { currentPaymentId: paymentId, currentInvoiceUrl: invoiceUrl });
    return { billing: updated, invoiceUrl: updated.currentInvoiceUrl };
  }

  async listPayments(auth: AuthContext) {
    const items = await this.payments.listByOrganization(auth.organizationId, 50);
    return { payments: items };
  }

  async handleWebhook(eventId: string, eventType: string, raw: Record<string, unknown>) {
    const already = await this.webhookEvents.exists(eventId);
    if (already) return { ok: true };
    await this.webhookEvents.markReceived(eventId, eventType, raw);

    try {
      if (eventType.startsWith("PAYMENT_")) {
        const payment = (raw as any)?.payment ?? null;
        const subscriptionId = payment?.subscription ?? null;
        if (!subscriptionId) {
          await this.webhookEvents.markProcessed(eventId, new Date());
          return { ok: true };
        }

        const b = await this.billing.findByAsaasSubscriptionId(subscriptionId);
        if (!b) {
          await this.webhookEvents.markProcessed(eventId, new Date());
          return { ok: true };
        }

        const dueDate = parseAsaasDate(payment?.dueDate);
        const value = typeof payment?.value === "number" ? payment.value : Number(payment?.value ?? NaN);
        const invoiceUrl = typeof payment?.invoiceUrl === "string" ? payment.invoiceUrl : null;
        const billingType = typeof payment?.billingType === "string" ? payment.billingType : null;

        await this.payments.upsert(payment.id, {
          organizationId: b.organizationId,
          subscriptionId,
          customerId: payment?.customer ?? null,
          status: String(payment?.status ?? ""),
          value: isNaN(value) ? null : value,
          dueDate,
          invoiceUrl,
          billingType,
          raw: payment,
        } as any);

        const upper = eventType.toUpperCase();
        if (upper === "PAYMENT_CREATED" || upper === "PAYMENT_UPDATED" || upper === "PAYMENT_OVERDUE") {
          const patch: any = {};
          if (invoiceUrl) patch.currentInvoiceUrl = invoiceUrl;
          if (payment?.id) patch.currentPaymentId = payment.id;
          if (upper === "PAYMENT_OVERDUE") patch.status = "PAST_DUE";
          await this.billing.upsert(b.organizationId, patch);
        }

        if (upper === "PAYMENT_CONFIRMED" || upper === "PAYMENT_RECEIVED") {
          const base = dueDate ?? new Date();
          const validUntil = addMonths(base, 1);
          await this.billing.upsert(b.organizationId, {
            status: "ACTIVE",
            validUntil,
            currentInvoiceUrl: null,
            currentPaymentId: null,
          });
        }

        if (upper === "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED" || upper === "PAYMENT_DELETED" || upper === "PAYMENT_REFUNDED") {
          await this.billing.upsert(b.organizationId, { status: "PAST_DUE" });
        }
      }

      await this.webhookEvents.markProcessed(eventId, new Date());
      return { ok: true };
    } catch (e) {
      await this.webhookEvents.markProcessed(eventId, new Date());
      throw e;
    }
  }
}
