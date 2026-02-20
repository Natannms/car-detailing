import { z } from "zod";
import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

const createSchema = z.object({
  patientId: z.string().uuid().optional().nullable(),
  clientName: z.string().min(1).max(200),
  clientPhone: z.string().min(1).max(40),
  urgency: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]),
  status: z.enum(["Agente", "Aguardando atendimento", "Em atendimento", "Finalizado"]),
});

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const url = new URL(request.url);
    const requestUnitId = url.searchParams.get("unitId") ?? undefined;
    const cards = await services.medicalKanban.list(auth, requestUnitId);
    return json({ cards });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = createSchema.parse(await request.json());
    const card = await services.medicalKanban.create(auth, {
      patientId: body.patientId ?? null,
      clientName: body.clientName,
      clientPhone: body.clientPhone,
      urgency: body.urgency,
      status: body.status,
    });
    return json({ card }, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}

