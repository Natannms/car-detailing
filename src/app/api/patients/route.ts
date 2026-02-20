import { z } from "zod";
import { services } from "../../../infrastructure/container";
import { requireAuthContext } from "../_lib/authFirebase";
import { errorToResponse, json } from "../_lib/response";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  cpf: z.string().max(20).optional().nullable(),
  rg: z.string().max(20).optional().nullable(),
  gender: z.enum(["MASCULINO", "FEMININO", "OUTRO"]).optional().nullable(),
  age: z.number().int().min(0).max(150).optional().nullable(),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional().nullable(),
  treatment: z.enum(["CONSULTA", "EXAME", "CIRURGIA", "TERAPIA", "VACINACAO", "OUTRO"]).optional().nullable(),
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

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const requestUnitId = url.searchParams.get("unitId") ?? undefined;
    const patients = q
      ? await services.patients.search(auth, q, requestUnitId)
      : await services.patients.list(auth, requestUnitId);
    return json({ patients });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = createSchema.parse(await request.json());
    const patient = await services.patients.create(auth, {
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      cpf: body.cpf ?? null,
      rg: body.rg ?? null,
      gender: body.gender ?? null,
      age: body.age ?? null,
      bloodType: body.bloodType ?? null,
      treatment: body.treatment ?? null,
      address: body.address ?? null,
    });
    return json({ patient }, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}

