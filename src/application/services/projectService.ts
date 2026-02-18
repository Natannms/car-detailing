import type { AuthContext } from "../../domain/entities";
import { ConflictError, ForbiddenError, NotFoundError } from "../../domain/errors";
import type { ClientRepository, CreateProjectInput, ProjectRepository } from "../../domain/repositories";

export class ProjectService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly clients: ClientRepository,
  ) {}

  async create(auth: AuthContext, input: Omit<CreateProjectInput, "organizationId">) {
    if (!auth.roles.includes("ORG_ADMIN")) throw new ForbiddenError();

    const name = input.name.trim();
    const code = input.code.trim();
    const summary = input.summary.trim();
    if (!name) throw new ConflictError("Nome inválido");
    if (!code) throw new ConflictError("Código inválido");
    if (!summary) throw new ConflictError("Resumo inválido");

    const existing = await this.projects.findByOrgAndName(auth.organizationId, name);
    if (existing) throw new ConflictError("Projeto já existe");

    const existingByCode = await this.projects.findByCode(code);
    if (existingByCode) throw new ConflictError("Código de projeto já existe");

    const clientId = input.clientId ?? null;
    if (clientId) {
      const client = await this.clients.findById(clientId);
      if (!client || client.organizationId !== auth.organizationId) throw new NotFoundError("Cliente não encontrado");
    }

    const createInput: CreateProjectInput = {
      organizationId: auth.organizationId,
      ...input,
      clientId,
      name,
      code,
      summary,
      description: input.description ?? null,
    };

    return this.projects.create(createInput);
  }

  async list(auth: AuthContext) {
    return this.projects.listByOrganization(auth.organizationId);
  }

  async get(auth: AuthContext, projectId: string) {
    const project = await this.projects.findById(projectId);
    if (!project) throw new NotFoundError("Projeto não encontrado");
    if (project.organizationId !== auth.organizationId) throw new ForbiddenError();
    return project;
  }
}
