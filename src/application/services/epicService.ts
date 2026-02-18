import type { AuthContext } from "../../domain/entities";
import { ConflictError, ForbiddenError, NotFoundError } from "../../domain/errors";
import type { CreateEpicInput, EpicRepository, ProjectRepository } from "../../domain/repositories";

export class EpicService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly epics: EpicRepository,
  ) {}

  async create(auth: AuthContext, input: Omit<CreateEpicInput, "projectId"> & { projectId: string }) {
    const project = await this.projects.findById(input.projectId);
    if (!project) throw new NotFoundError("Projeto não encontrado");
    if (project.organizationId !== auth.organizationId) throw new ForbiddenError();

    const existing = await this.epics.findByProjectAndTitle(input.projectId, input.title);
    if (existing) throw new ConflictError("Épico já existe no projeto");

    return this.epics.create({
      projectId: input.projectId,
      title: input.title,
      context: input.context ?? null,
      expected: input.expected ?? null,
      status: input.status ?? "TODO",
    });
  }

  async list(auth: AuthContext, projectId: string) {
    const project = await this.projects.findById(projectId);
    if (!project) throw new NotFoundError("Projeto não encontrado");
    if (project.organizationId !== auth.organizationId) throw new ForbiddenError();
    return this.epics.listByProject(projectId);
  }

  async get(auth: AuthContext, epicId: string) {
    const epic = await this.epics.findById(epicId);
    if (!epic) throw new NotFoundError("Épico não encontrado");
    const project = await this.projects.findById(epic.projectId);
    if (!project) throw new NotFoundError("Projeto não encontrado");
    if (project.organizationId !== auth.organizationId) throw new ForbiddenError();
    return epic;
  }

  async update(
    auth: AuthContext,
    epicId: string,
    patch: { title?: string; context?: string | null; expected?: string | null; status?: string },
  ) {
    const epic = await this.get(auth, epicId);

    if (patch.title && patch.title !== epic.title) {
      const existing = await this.epics.findByProjectAndTitle(epic.projectId, patch.title);
      if (existing) throw new ConflictError("Épico já existe no projeto");
    }

    return this.epics.update(epicId, patch);
  }

  async delete(auth: AuthContext, epicId: string) {
    await this.get(auth, epicId);
    await this.epics.delete(epicId);
  }
}
