import type { AuthContext } from "../../domain/entities";
import { ConflictError, ForbiddenError, NotFoundError } from "../../domain/errors";
import type { EpicRepository, ProjectRepository, StoryRepository, TaskBoardColumnRepository, TaskRepository } from "../../domain/repositories";

export class TaskBoardColumnService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly epics: EpicRepository,
    private readonly stories: StoryRepository,
    private readonly tasks: TaskRepository,
    private readonly columns: TaskBoardColumnRepository,
  ) {}

  private async requireStoryAccess(auth: AuthContext, storyId: string) {
    const story = await this.stories.findById(storyId);
    if (!story) throw new NotFoundError("Story não encontrada");
    const epic = await this.epics.findById(story.epicId);
    if (!epic) throw new NotFoundError("Épico não encontrado");
    const project = await this.projects.findById(epic.projectId);
    if (!project) throw new NotFoundError("Projeto não encontrado");
    if (project.organizationId !== auth.organizationId) throw new ForbiddenError();
    return { story, epic, project };
  }

  private async ensureDefaults(storyId: string) {
    const existing = await this.columns.listByStory(storyId);
    if (existing.length) return existing;
    await this.columns.create({ storyId, name: "TODO", order: 1 });
    await this.columns.create({ storyId, name: "DOING", order: 2 });
    await this.columns.create({ storyId, name: "DONE", order: 3 });
    return this.columns.listByStory(storyId);
  }

  async list(auth: AuthContext, storyId: string) {
    await this.requireStoryAccess(auth, storyId);
    return this.ensureDefaults(storyId);
  }

  async create(auth: AuthContext, input: { storyId: string; name: string }) {
    if (!auth.roles.includes("ORG_ADMIN")) throw new ForbiddenError();
    await this.requireStoryAccess(auth, input.storyId);

    const name = input.name.trim();
    if (!name) throw new ConflictError("Nome inválido");

    const existing = await this.columns.findByStoryAndName(input.storyId, name);
    if (existing) throw new ConflictError("Coluna já existe");

    const columns = await this.ensureDefaults(input.storyId);
    const nextOrder = Math.max(...columns.map(c => c.order), 0) + 1;
    return this.columns.create({ storyId: input.storyId, name, order: nextOrder });
  }

  async rename(auth: AuthContext, input: { columnId: string; name: string }) {
    if (!auth.roles.includes("ORG_ADMIN")) throw new ForbiddenError();

    const column = await this.columns.findById(input.columnId);
    if (!column) throw new NotFoundError("Coluna não encontrada");

    await this.requireStoryAccess(auth, column.storyId);

    const name = input.name.trim();
    if (!name) throw new ConflictError("Nome inválido");
    if (name === column.name) return column;

    const existing = await this.columns.findByStoryAndName(column.storyId, name);
    if (existing) throw new ConflictError("Já existe uma coluna com esse nome");

    const tasks = await this.tasks.listByStory(column.storyId);
    await Promise.all(
      tasks.filter(t => t.status === column.name).map(t => this.tasks.update(t.id, { status: name })),
    );

    return this.columns.update(column.id, { name });
  }

  async delete(auth: AuthContext, input: { columnId: string }) {
    if (!auth.roles.includes("ORG_ADMIN")) throw new ForbiddenError();

    const column = await this.columns.findById(input.columnId);
    if (!column) throw new NotFoundError("Coluna não encontrada");

    await this.requireStoryAccess(auth, column.storyId);

    const columns = await this.ensureDefaults(column.storyId);
    const fallback = columns.find(c => c.id !== column.id) ?? null;
    if (!fallback) throw new ConflictError("Não é possível excluir a última coluna");

    const tasks = await this.tasks.listByStory(column.storyId);
    await Promise.all(
      tasks.filter(t => t.status === column.name).map(t => this.tasks.update(t.id, { status: fallback.name })),
    );

    await this.columns.delete(column.id);
  }
}

