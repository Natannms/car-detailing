import { z } from "zod";
import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

export const runtime = "nodejs";

const schema = z.object({
  planId: z.string().min(1).max(40).optional().nullable(),
  billingType: z.enum(["PIX", "CREDIT_CARD"]),
  customer: z.object({
    name: z.string().min(2).max(200),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(40).optional().nullable(),
    mobilePhone: z.string().max(40).optional().nullable(),
    cpfCnpj: z.string().max(20).optional().nullable(),
    postalCode: z.string().max(20).optional().nullable(),
    address: z.string().max(200).optional().nullable(),
    addressNumber: z.string().max(50).optional().nullable(),
    province: z.string().max(100).optional().nullable(),
    city: z.string().max(120).optional().nullable(),
    state: z.string().max(20).optional().nullable(),
  }),
});

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request, { allowUnsubscribed: true });
    const body = schema.parse(await request.json());
    const r = await services.billing.setup(auth, body as any);
    return json(r, { status: 201 });
  } catch (e) {
    console.error("[billing/setup] error", e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("Asaas ")) {
      return json({ error: { code: "ASAAS_ERROR", message: "Falha ao comunicar com o Asaas." } }, { status: 502 });
    }
    if (msg.includes("TOKEN_GATEWAY ausente")) {
      return json({ error: { code: "SERVER_MISCONFIG", message: "Configuração de pagamento ausente no servidor." } }, { status: 500 });
    }
    return errorToResponse(e);
  }
}
