import { z } from "zod";
import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(320).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  cpf: z.string().max(20).optional().nullable(),
  rg: z.string().max(20).optional().nullable(),
  gender: z.enum(["MASCULINO", "FEMININO", "OUTRO"]).optional().nullable(),
  age: z.number().int().min(0).max(150).optional().nullable(),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional().nullable(),
  treatment: z.enum(["CONSULTA", "EXAME", "CIRURGIA", "TERAPIA", "VACINACAO", "OUTRO"]).optional().nullable(),
  attendanceStatus: z.enum(["Agent", "Waiting", "InProgress", "Finished"]).optional().nullable(),
  address: z
    .object({
      street: z.string().max(200),
      district: z.string().max(200),
      city: z.string().max(200),
      state: z.string().max(50),
      number: z.string().max(50),
    })
    .optional()
    .nullable(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    const body = updateSchema.parse(await request.json());
    const patient = await services.patients.update(auth, id, body as any);
    return json({ patient });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    await services.patients.delete(auth, id);
    return json({ ok: true });
  } catch (e) {
    return errorToResponse(e);
  }
}

