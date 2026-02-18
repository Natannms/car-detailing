import type { AuthContext } from "../../domain/entities";
import { ConflictError, ForbiddenError, NotFoundError } from "../../domain/errors";
import type { CreateStoryInput, EpicRepository, ProjectRepository, StoryRepository } from "../../domain/repositories";

export class StoryService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly epics: EpicRepository,
    private readonly stories: StoryRepository,
  ) {}

  async create(auth: AuthContext, input: Omit<CreateStoryInput, "epicId"> & { epicId: string }) {
    const epic = await this.epics.findById(input.epicId);
    if (!epic) throw new NotFoundError("Épico não encontrado");

    const project = await this.projects.findById(epic.projectId);
    if (!project) throw new NotFoundError("Projeto não encontrado");
    if (project.organizationId !== auth.organizationId) throw new ForbiddenError();

    const existing = await this.stories.findByEpicAndTitle(input.epicId, input.title);
    if (existing) throw new ConflictError("Story já existe no épico");

    return this.stories.create({
      epicId: input.epicId,
      title: input.title,
      userStory: input.userStory,
      acceptanceCriteria: input.acceptanceCriteria,
      status: input.status ?? "TODO",
      points: input.points ?? null,
    });
  }

  async list(auth: AuthContext, epicId: string) {
    const epic = await this.epics.findById(epicId);
    if (!epic) throw new NotFoundError("Épico não encontrado");
    const project = await this.projects.findById(epic.projectId);
    if (!project) throw new NotFoundError("Projeto não encontrado");
    if (project.organizationId !== auth.organizationId) throw new ForbiddenError();
    return this.stories.listByEpic(epicId);
  }

  async get(auth: AuthContext, storyId: string) {
    const story = await this.stories.findById(storyId);
    if (!story) throw new NotFoundError("Story não encontrada");
    const epic = await this.epics.findById(story.epicId);
    if (!epic) throw new NotFoundError("Épico não encontrado");
    const project = await this.projects.findById(epic.projectId);
    if (!project) throw new NotFoundError("Projeto não encontrado");
    if (project.organizationId !== auth.organizationId) throw new ForbiddenError();
    return story;
  }

  async update(
    auth: AuthContext,
    storyId: string,
    patch: { title?: string; userStory?: string; acceptanceCriteria?: string; status?: string; points?: number | null },
  ) {
    const story = await this.get(auth, storyId);
    if (patch.title && patch.title !== story.title) {
      const existing = await this.stories.findByEpicAndTitle(story.epicId, patch.title);
      if (existing) throw new ConflictError("Story já existe no épico");
    }
    return this.stories.update(storyId, patch);
  }

  async delete(auth: AuthContext, storyId: string) {
    await this.get(auth, storyId);
    await this.stories.delete(storyId);
  }
}
