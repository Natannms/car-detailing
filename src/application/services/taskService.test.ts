import { TaskService } from "./taskService";
import type { AuthContext, Epic, Project, Story, Task } from "../../domain/entities";
import type { EpicRepository, ProjectRepository, StoryRepository, TaskRepository } from "../../domain/repositories";

class InMemoryProjectRepo implements ProjectRepository {
  projects: Project[] = [];
  async create(input: any) {
    const project: Project = { id: `p-${this.projects.length + 1}`, organizationId: input.organizationId, name: input.name };
    this.projects.push(project);
    return project;
  }
  async findById(id: string) {
    return this.projects.find(p => p.id === id) ?? null;
  }
  async findByOrgAndName(organizationId: string, name: string) {
    return this.projects.find(p => p.organizationId === organizationId && p.name === name) ?? null;
  }
  async listByOrganization(organizationId: string) {
    return this.projects.filter(p => p.organizationId === organizationId);
  }
}

class InMemoryEpicRepo implements EpicRepository {
  epics: Epic[] = [];
  async create(input: any) {
    const epic: Epic = { id: `e-${this.epics.length + 1}`, projectId: input.projectId, title: input.title, context: null, expected: null, status: "TODO" };
    this.epics.push(epic);
    return epic;
  }
  async update(id: string, patch: any) {
    const epic = this.epics.find(e => e.id === id);
    if (!epic) throw new Error("missing epic");
    Object.assign(epic, patch);
    return epic;
  }
  async delete(id: string) {
    this.epics = this.epics.filter(e => e.id !== id);
  }
  async findById(id: string) {
    return this.epics.find(e => e.id === id) ?? null;
  }
  async findByProjectAndTitle(projectId: string, title: string) {
    return this.epics.find(e => e.projectId === projectId && e.title === title) ?? null;
  }
  async listByProject(projectId: string) {
    return this.epics.filter(e => e.projectId === projectId);
  }
}

class InMemoryStoryRepo implements StoryRepository {
  stories: Story[] = [];
  async create(input: any) {
    const story: Story = {
      id: `s-${this.stories.length + 1}`,
      epicId: input.epicId,
      title: input.title,
      userStory: input.userStory,
      acceptanceCriteria: input.acceptanceCriteria,
      status: input.status ?? "TODO",
      points: input.points ?? null,
    };
    this.stories.push(story);
    return story;
  }
  async update(id: string, patch: any) {
    const story = this.stories.find(s => s.id === id);
    if (!story) throw new Error("missing story");
    Object.assign(story, patch);
    return story;
  }
  async delete(id: string) {
    this.stories = this.stories.filter(s => s.id !== id);
  }
  async findById(id: string) {
    return this.stories.find(s => s.id === id) ?? null;
  }
  async findByEpicAndTitle(epicId: string, title: string) {
    return this.stories.find(s => s.epicId === epicId && s.title === title) ?? null;
  }
  async listByEpic(epicId: string) {
    return this.stories.filter(s => s.epicId === epicId);
  }
}

class InMemoryTaskRepo implements TaskRepository {
  tasks: Task[] = [];
  async create(input: any) {
    const task: Task = {
      id: `t-${this.tasks.length + 1}`,
      storyId: input.storyId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "TODO",
    };
    this.tasks.push(task);
    return task;
  }
  async update(id: string, patch: any) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) throw new Error("missing task");
    Object.assign(task, patch);
    return task;
  }
  async delete(id: string) {
    this.tasks = this.tasks.filter(t => t.id !== id);
  }
  async findById(id: string) {
    return this.tasks.find(t => t.id === id) ?? null;
  }
  async findByStoryAndTitle(storyId: string, title: string) {
    return this.tasks.find(t => t.storyId === storyId && t.title === title) ?? null;
  }
  async listByStory(storyId: string) {
    return this.tasks.filter(t => t.storyId === storyId);
  }
}

describe("TaskService", () => {
  const auth: AuthContext = {
    userId: "11111111-1111-1111-1111-111111111111",
    organizationId: "22222222-2222-2222-2222-222222222222",
    roles: ["ORG_ADMIN"],
  };

  it("cria e lista tasks por story", async () => {
    const projects = new InMemoryProjectRepo();
    const epics = new InMemoryEpicRepo();
    const stories = new InMemoryStoryRepo();
    const tasks = new InMemoryTaskRepo();

    projects.projects.push({ id: "p1", organizationId: auth.organizationId, name: "Demo" });
    epics.epics.push({ id: "e1", projectId: "p1", title: "Epic", context: null, expected: null, status: "TODO" });
    stories.stories.push({
      id: "s1",
      epicId: "e1",
      title: "Story",
      userStory: "Eu como X",
      acceptanceCriteria: "Dado que A",
      status: "TODO",
      points: null,
    });

    const svc = new TaskService(projects, epics, stories, tasks);
    const created = await svc.create(auth, { storyId: "s1", title: "Task 1" });
    expect(created.title).toBe("Task 1");

    const list = await svc.list(auth, "s1");
    expect(list).toHaveLength(1);
  });

  it("atualiza e remove task", async () => {
    const projects = new InMemoryProjectRepo();
    const epics = new InMemoryEpicRepo();
    const stories = new InMemoryStoryRepo();
    const tasks = new InMemoryTaskRepo();

    projects.projects.push({ id: "p1", organizationId: auth.organizationId, name: "Demo" });
    epics.epics.push({ id: "e1", projectId: "p1", title: "Epic", context: null, expected: null, status: "TODO" });
    stories.stories.push({
      id: "s1",
      epicId: "e1",
      title: "Story",
      userStory: "Eu como X",
      acceptanceCriteria: "Dado que A",
      status: "TODO",
      points: null,
    });

    const svc = new TaskService(projects, epics, stories, tasks);
    const created = await svc.create(auth, { storyId: "s1", title: "Task 1" });
    const updated = await svc.update(auth, created.id, { title: "Task 1 - Updated" });
    expect(updated.title).toBe("Task 1 - Updated");

    await svc.delete(auth, created.id);
    await expect(svc.get(auth, created.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
