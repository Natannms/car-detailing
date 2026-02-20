import { z } from "zod";
import { services } from "../../../../../infrastructure/container";
import { requireAuthContext } from "../../../_lib/authFirebase";
import { errorToResponse, json } from "../../../_lib/response";

const updateSchema = z.object({
  patientId: z.string().uuid().optional().nullable(),
  clientName: z.string().min(1).max(200).optional(),
  clientPhone: z.string().min(1).max(40).optional(),
  urgency: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  status: z.enum(["Agente", "Aguardando atendimento", "Em atendimento", "Finalizado"]).optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    const body = updateSchema.parse(await request.json());
    const card = await services.medicalKanban.update(auth, id, body as any);
    return json({ card });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    await services.medicalKanban.delete(auth, id);
    return json({ ok: true });
  } catch (e) {
    return errorToResponse(e);
  }
}

