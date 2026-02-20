import { services } from "../../../infrastructure/container";
import { json } from "../../api/_lib/response";
import { appendFile } from "node:fs/promises";
import { resolve } from "node:path";

export const runtime = "nodejs";

async function logLine(entry: Record<string, unknown>) {
  try {
    const file = process.env.ASAAS_WEBHOOK_LOG_FILE || "asaas-webhook.log.txt";
    const abs = resolve(process.cwd(), file);
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry });
    await appendFile(abs, `${line}\n`, { encoding: "utf8" });
  } catch {}
}

export async function POST(request: Request) {
  const expected = process.env.ASAAS_TOKEN_AUTH || process.env.ASAAS_WEBHOOK_TOKEN || null;
  const provided = request.headers.get("asaas-access-token");
  if (expected && provided !== expected) {
    await logLine({ stage: "rejected", reason: "invalid_token" });
    return json({ received: true }, { status: 200 });
  }

  const body = (await request.json().catch(() => null)) as any;
  const eventId = String(body?.id ?? "");
  const eventType = String(body?.event ?? "");
  const payment = body?.payment ?? null;
  const subscriptionId = payment?.subscription ?? body?.subscription?.id ?? null;
  const paymentId = payment?.id ?? null;
  const paymentStatus = payment?.status ?? null;
  const invoiceUrl = payment?.invoiceUrl ?? null;

  if (!eventId || !eventType) {
    await logLine({
      stage: "ignored",
      reason: "missing_event_fields",
      hasBody: Boolean(body),
    });
    return json({ received: true }, { status: 200 });
  }

  await logLine({
    stage: "received",
    eventId,
    eventType,
    subscriptionId,
    paymentId,
    paymentStatus,
    invoiceUrl,
  });

  try {
    await services.billing.handleWebhook(eventId, eventType, body);
    await logLine({ stage: "processed", eventId, eventType });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    await logLine({ stage: "error", eventId, eventType, message });
    return json({ received: true }, { status: 200 });
  }
  return json({ received: true }, { status: 200 });
}
