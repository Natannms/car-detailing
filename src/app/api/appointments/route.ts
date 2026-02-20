import { z } from "zod";
import { services } from "../../../infrastructure/container";
import { requireAuthContext } from "../_lib/authFirebase";
import { errorToResponse, json } from "../_lib/response";

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

const createSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
  status: statusEnum,
  workflowStatus: z.enum(["RECEPCAO", "AGUARDANDO", "EM_ATENDIMENTO", "FINALIZADO"]).optional(),
  notes: z.string().max(4000).optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const requestUnitId = new URL(request.url).searchParams.get("unitId");
    const appointments = await services.appointments.list(auth, requestUnitId);
    return json({ appointments });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = createSchema.parse(await request.json());
    const appointment = await services.appointments.create(auth, {
      patientId: body.patientId,
      doctorId: body.doctorId,
      scheduledAt: body.scheduledAt,
      status: body.status,
      workflowStatus: body.workflowStatus ?? "RECEPCAO",
      notes: body.notes ?? null,
    });
    return json({ appointment }, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}
