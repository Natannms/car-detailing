import type { AuthContext } from "../../domain/entities";
import { ConflictError, ForbiddenError, NotFoundError } from "../../domain/errors";
import type {
  CreateTaskInput,
  EpicRepository,
  ProjectRepository,
  StoryRepository,
  TaskRepository,
} from "../../domain/repositories";

export class TaskService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly epics: EpicRepository,
    private readonly stories: StoryRepository,
    private readonly tasks: TaskRepository,
  ) {}

  async create(auth: AuthContext, input: Omit<CreateTaskInput, "storyId"> & { storyId: string }) {
    const story = await this.stories.findById(input.storyId);
    if (!story) throw new NotFoundError("Story não encontrada");

    const epic = await this.epics.findById(story.epicId);
    if (!epic) throw new NotFoundError("Épico não encontrado");

    const project = await this.projects.findById(epic.projectId);
    if (!project) throw new NotFoundError("Projeto não encontrado");
    if (project.organizationId !== auth.organizationId) throw new ForbiddenError();

    const existing = await this.tasks.findByStoryAndTitle(input.storyId, input.title);
    if (existing) throw new ConflictError("Task já existe na story");

    return this.tasks.create({
      storyId: input.storyId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "TODO",
    });
  }

  async list(auth: AuthContext, storyId: string) {
    const story = await this.stories.findById(storyId);
    if (!story) throw new NotFoundError("Story não encontrada");
    const epic = await this.epics.findById(story.epicId);
    if (!epic) throw new NotFoundError("Épico não encontrado");
    const project = await this.projects.findById(epic.projectId);
    if (!project) throw new NotFoundError("Projeto não encontrado");
    if (project.organizationId !== auth.organizationId) throw new ForbiddenError();
    return this.tasks.listByStory(storyId);
  }

  async get(auth: AuthContext, taskId: string) {
    const task = await this.tasks.findById(taskId);
    if (!task) throw new NotFoundError("Task não encontrada");
    const story = await this.stories.findById(task.storyId);
    if (!story) throw new NotFoundError("Story não encontrada");
    const epic = await this.epics.findById(story.epicId);
    if (!epic) throw new NotFoundError("Épico não encontrado");
    const project = await this.projects.findById(epic.projectId);
    if (!project) throw new NotFoundError("Projeto não encontrado");
    if (project.organizationId !== auth.organizationId) throw new ForbiddenError();
    return task;
  }

  async update(auth: AuthContext, taskId: string, patch: { title?: string; description?: string | null; status?: string }) {
    const task = await this.get(auth, taskId);
    if (patch.title && patch.title !== task.title) {
      const existing = await this.tasks.findByStoryAndTitle(task.storyId, patch.title);
      if (existing) throw new ConflictError("Task já existe na story");
    }
    return this.tasks.update(taskId, patch);
  }

  async delete(auth: AuthContext, taskId: string) {
    await this.get(auth, taskId);
    await this.tasks.delete(taskId);
  }
}
