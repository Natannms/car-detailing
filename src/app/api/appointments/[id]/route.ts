import { z } from "zod";
import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

const statusEnum = z.enum([
  "AGENDADO",
  "PRIMEIRA_CONSULTA",
  "RETORNO",
  "URGENCIA",
  "EMERGENCIA",
  "AVALIACAO",
  "ENCAMINHAMENTO",
  "PRE_OPERATORIO",
  "POS_OPERATORIO",
  "MANUTENCAO",
  "TELECONSULTA_ONLINE",
  "RETORNO_REMARCADO",
]);

const updateSchema = z.object({
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  scheduledAt: z.coerce.date().optional(),
  status: statusEnum.optional(),
  workflowStatus: z.enum(["RECEPCAO", "AGUARDANDO", "EM_ATENDIMENTO", "FINALIZADO"]).optional(),
  notes: z.string().max(4000).optional().nullable(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    const body = updateSchema.parse(await request.json());
    const appointment = await services.appointments.update(auth, id, body as any);
    return json({ appointment });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    await services.appointments.delete(auth, id);
    return json({ ok: true });
  } catch (e) {
    return errorToResponse(e);
  }
}
