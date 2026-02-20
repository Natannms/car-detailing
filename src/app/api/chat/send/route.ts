import { z } from "zod";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";
import { repositories } from "../../../../infrastructure/container";

export const runtime = "nodejs";

const sendSchema = z.object({
  patientId: z.string().uuid(),
  messageText: z.string().min(1).max(4000),
});

function normalizePhone(phone: string | null): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = sendSchema.parse(await request.json());

    const patient = await repositories.patients.findById(body.patientId);
    if (!patient || patient.organizationId !== auth.organizationId) {
      return json({ error: "Paciente não encontrado" }, { status: 404 });
    }
    if (patient.attendanceStatus !== "InProgress") {
      return json(
        { error: "Mova o card para Em atendimento para enviar mensagens." },
        { status: 400 },
      );
    }

    const endpoint = process.env.CHAT_ENDPOINT_MESSAGES?.trim();
    if (!endpoint) {
      return json({ error: "Chat endpoint não configurado" }, { status: 503 });
    }

    const customerPhone = normalizePhone(patient.phone) || patient.phone || "";
    const payload = {
      customerPhone,
      messageText: body.messageText,
      organizationId: auth.organizationId,
      unit_id: patient.unitId ?? null,
      isBot: false,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return json(
        { error: "Falha ao enviar mensagem", detail: text.slice(0, 200) },
        { status: res.status >= 400 && res.status < 500 ? res.status : 502 },
      );
    }

    return json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return json({ error: "Dados inválidos", details: e.flatten() }, { status: 400 });
    }
    return errorToResponse(e);
  }
}
