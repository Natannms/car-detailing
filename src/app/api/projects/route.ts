import { z } from "zod";
import { services } from "../../../infrastructure/container";
import { requireAuthContext } from "../_lib/authFirebase";
import { errorToResponse, json } from "../_lib/response";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(80),
  summary: z.string().min(1).max(500),
  description: z.string().max(8000).optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  type: z.enum(["SAAS", "CLIENT", "INTERNAL", "MVP", "POC"]),
  methodology: z.enum(["SCRUM", "KANBAN", "HYBRID", "WATERFALL"]),
  startDate: z.coerce.date(),
  estimatedEndDate: z.coerce.date().optional().nullable(),
  actualEndDate: z.coerce.date().optional().nullable(),
  status: z.enum(["BACKLOG", "PLANNING", "EXECUTION", "HOMOLOGATION", "PRODUCTION", "FINISHED", "CANCELED"]).optional(),
  health: z.enum(["GREEN", "YELLOW", "RED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  complexity: z.coerce.number().int().min(1).max(5).optional().nullable(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().nullable(),
  billingModel: z.enum(["FIXED", "HOURLY", "MONTHLY"]).optional().nullable(),
  contractValue: z.coerce.number().optional().nullable(),
  slaHours: z.coerce.number().int().optional().nullable(),
  estimatedHours: z.coerce.number().optional().nullable(),
  actualHours: z.coerce.number().optional().nullable(),
  estimatedBudget: z.coerce.number().optional().nullable(),
  actualCost: z.coerce.number().optional().nullable(),
  expectedMargin: z.coerce.number().optional().nullable(),
  actualMargin: z.coerce.number().optional().nullable(),
  mainStack: z.string().max(500).optional().nullable(),
  architecture: z.enum(["MONOLITH", "MICROSERVICES", "EVENT_DRIVEN"]).optional().nullable(),
  databaseType: z.string().max(200).optional().nullable(),
  cloudProvider: z.string().max(200).optional().nullable(),
  repositoryUrl: z.string().max(1000).optional().nullable(),
  allowMultipleTeams: z.boolean().optional(),
  allowMultipleBoards: z.boolean().optional(),
  financialControl: z.boolean().optional(),
  visibility: z.enum(["PRIVATE", "ORGANIZATION", "PUBLIC"]).optional(),
});

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const projects = await services.projects.list(auth);
    return json({ projects });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = createSchema.parse(await request.json());
    const project = await services.projects.create(auth, body);
    return json({ project }, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}
