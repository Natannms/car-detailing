import type { AuthContext, Epic, Project, Story, Task } from "../../domain/entities";
import type { EpicRepository, ProjectRepository, StoryRepository, TaskBoardColumnRepository, TaskRepository } from "../../domain/repositories";
import { TaskBoardColumnService } from "./taskBoardColumnService";

type Column = { id: string; storyId: string; name: string; order: number };

class InMemoryProjects implements ProjectRepository {
  projects: Project[] = [];
  async create(): Promise<any> {
    throw new Error("not implemented");
  }
  async findById(id: string) {
    return this.projects.find(p => p.id === id) ?? null;
  }
  async findByCode(): Promise<any> {
    throw new Error("not implemented");
  }
  async findByOrgAndName(): Promise<any> {
    throw new Error("not implemented");
  }
  async listByOrganization(): Promise<any> {
    throw new Error("not implemented");
  }
}

class InMemoryEpics implements EpicRepository {
  epics: Epic[] = [];
  async create(): Promise<any> {
    throw new Error("not implemented");
  }
  async update(): Promise<any> {
    throw new Error("not implemented");
  }
  async delete(): Promise<any> {
    throw new Error("not implemented");
  }
  async findById(id: string) {
    return this.epics.find(e => e.id === id) ?? null;
  }
  async findByProjectAndTitle(): Promise<any> {
    throw new Error("not implemented");
  }
  async listByProject(): Promise<any> {
    throw new Error("not implemented");
  }
}

class InMemoryStories implements StoryRepository {
  stories: Story[] = [];
  async create(): Promise<any> {
    throw new Error("not implemented");
  }
  async update(): Promise<any> {
    throw new Error("not implemented");
  }
  async delete(): Promise<any> {
    throw new Error("not implemented");
  }
  async findById(id: string) {
    return this.stories.find(s => s.id === id) ?? null;
  }
  async findByEpicAndTitle(): Promise<any> {
    throw new Error("not implemented");
  }
  async listByEpic(): Promise<any> {
    throw new Error("not implemented");
  }
}

class InMemoryTasks implements TaskRepository {
  tasks: Task[] = [];
  async create(): Promise<any> {
    throw new Error("not implemented");
  }
  async update(id: string, patch: Partial<Omit<Task, "id" | "storyId">>) {
    const t = this.tasks.find(x => x.id === id);
    if (!t) throw new Error("not found");
    Object.assign(t, patch);
    return t;
  }
  async delete(): Promise<any> {
    throw new Error("not implemented");
  }
  async findById(id: string) {
    return this.tasks.find(t => t.id === id) ?? null;
  }
  async findByStoryAndTitle(): Promise<any> {
    throw new Error("not implemented");
  }
  async listByStory(storyId: string) {
    return this.tasks.filter(t => t.storyId === storyId);
  }
}

class InMemoryColumns implements TaskBoardColumnRepository {
  columns: Column[] = [];
  async create(input: { storyId: string; name: string; order: number }) {
    const c: Column = { id: `c-${this.columns.length + 1}`, storyId: input.storyId, name: input.name, order: input.order };
    this.columns.push(c);
    return c;
  }
  async update(id: string, patch: Partial<{ name: string; order: number }>) {
    const c = this.columns.find(x => x.id === id);
    if (!c) throw new Error("not found");
    Object.assign(c, patch);
    return c;
  }
  async delete(id: string) {
    this.columns = this.columns.filter(c => c.id !== id);
  }
  async findById(id: string) {
    return this.columns.find(c => c.id === id) ?? null;
  }
  async findByStoryAndName(storyId: string, name: string) {
    return this.columns.find(c => c.storyId === storyId && c.name === name) ?? null;
  }
  async listByStory(storyId: string) {
    return this.columns.filter(c => c.storyId === storyId).sort((a, b) => a.order - b.order);
  }
}

describe("TaskBoardColumnService", () => {
  const orgA = "22222222-2222-2222-2222-222222222222";
  const orgB = "33333333-3333-3333-3333-333333333333";
  const admin: AuthContext = { userId: "11111111-1111-1111-1111-111111111111", organizationId: orgA, roles: ["ORG_ADMIN"] };
  const member: AuthContext = { userId: "11111111-1111-1111-1111-111111111111", organizationId: orgA, roles: ["MEMBER"] };

  const setup = (opts?: { orgId?: string; withEpic?: boolean; withProject?: boolean; withStory?: boolean }) => {
    const projects = new InMemoryProjects();
    const epics = new InMemoryEpics();
    const stories = new InMemoryStories();
    const tasks = new InMemoryTasks();
    const columns = new InMemoryColumns();

    projects.projects.push({
      id: "p1",
      organizationId: opts?.orgId ?? orgA,
      name: "P",
      code: "P-1",
      summary: "S",
      description: null,
      type: "SAAS",
      methodology: "KANBAN",
      status: "BACKLOG",
      health: "GREEN",
      priority: "MEDIUM",
      complexity: null,
      riskLevel: null,
      startDate: new Date(),
      estimatedEndDate: null,
      actualEndDate: null,
      estimatedHours: null,
      actualHours: null,
      contractValue: null,
      billingModel: null,
      slaHours: null,
      estimatedBudget: null,
      actualCost: null,
      expectedMargin: null,
      actualMargin: null,
      mainStack: null,
      architecture: null,
      databaseType: null,
      cloudProvider: null,
      repositoryUrl: null,
      allowMultipleTeams: false,
      allowMultipleBoards: false,
      financialControl: false,
      visibility: "PRIVATE",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      clientId: null,
      client: null,
    });

    if (opts?.withProject === false) {
      projects.projects = [];
    }

    if (opts?.withEpic !== false) {
      epics.epics.push({ id: "e1", projectId: "p1", title: "E", context: null, expected: null, status: "TODO" });
    }

    if (opts?.withStory !== false) {
      stories.stories.push({ id: "s1", epicId: "e1", title: "S", userStory: "u", acceptanceCriteria: "a", status: "TODO", points: null });
    }

    const svc = new TaskBoardColumnService(projects, epics, stories, tasks, columns);
    return { svc, tasks, columns, projects, epics, stories };
  };

  it("bloqueia list quando story não existe", async () => {
    const { svc } = setup({ withStory: false });
    await expect(svc.list(admin, "s1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("bloqueia list quando épico não existe", async () => {
    const { svc } = setup({ withEpic: false });
    await expect(svc.list(admin, "s1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("bloqueia list quando projeto não existe", async () => {
    const { svc } = setup({ withProject: false });
    await expect(svc.list(admin, "s1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("bloqueia list quando organização é diferente", async () => {
    const { svc } = setup({ orgId: orgB });
    await expect(svc.list(admin, "s1")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lista cria colunas default quando vazio", async () => {
    const { svc, columns } = setup();
    const list = await svc.list(admin, "s1");
    expect(list.map(c => c.name)).toEqual(["TODO", "DOING", "DONE"]);
    expect(columns.columns).toHaveLength(3);
  });

  it("list não cria defaults quando já existem colunas", async () => {
    const { svc, columns } = setup();
    columns.columns.push({ id: "c-x", storyId: "s1", name: "READY", order: 1 });
    const list = await svc.list(admin, "s1");
    expect(list.map(c => c.name)).toEqual(["READY"]);
  });

  it("cria nova coluna apenas para ORG_ADMIN", async () => {
    const { svc } = setup();
    await svc.list(admin, "s1");
    await expect(svc.create(member, { storyId: "s1", name: "QA" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const created = await svc.create(admin, { storyId: "s1", name: "QA" });
    expect(created.name).toBe("QA");
  });

  it("bloqueia criar coluna com nome vazio", async () => {
    const { svc } = setup();
    await svc.list(admin, "s1");
    await expect(svc.create(admin, { storyId: "s1", name: "   " })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("bloqueia criar coluna duplicada", async () => {
    const { svc } = setup();
    await svc.list(admin, "s1");
    await svc.create(admin, { storyId: "s1", name: "QA" });
    await expect(svc.create(admin, { storyId: "s1", name: "QA" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("renomear coluna atualiza status das tasks", async () => {
    const { svc, tasks } = setup();
    const list = await svc.list(admin, "s1");
    const todo = list.find(c => c.name === "TODO")!;
    tasks.tasks.push({ id: "t1", storyId: "s1", title: "T", description: null, status: "TODO" });

    await svc.rename(admin, { columnId: todo.id, name: "TO_DO" });
    expect(tasks.tasks[0]?.status).toBe("TO_DO");
  });

  it("rename retorna coluna quando nome não muda", async () => {
    const { svc } = setup();
    const list = await svc.list(admin, "s1");
    const todo = list.find(c => c.name === "TODO")!;
    const result = await svc.rename(admin, { columnId: todo.id, name: "TODO" });
    expect(result.id).toBe(todo.id);
  });

  it("bloqueia rename com nome vazio", async () => {
    const { svc } = setup();
    const list = await svc.list(admin, "s1");
    const todo = list.find(c => c.name === "TODO")!;
    await expect(svc.rename(admin, { columnId: todo.id, name: "   " })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("bloqueia rename quando coluna não existe", async () => {
    const { svc } = setup();
    await expect(svc.rename(admin, { columnId: "nope", name: "X" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("bloqueia rename quando já existe coluna com o nome", async () => {
    const { svc } = setup();
    const list = await svc.list(admin, "s1");
    const todo = list.find(c => c.name === "TODO")!;
    await expect(svc.rename(admin, { columnId: todo.id, name: "DOING" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("excluir coluna move tasks para fallback", async () => {
    const { svc, tasks, columns } = setup();
    const list = await svc.list(admin, "s1");
    const doing = list.find(c => c.name === "DOING")!;
    tasks.tasks.push({ id: "t1", storyId: "s1", title: "T", description: null, status: "DOING" });

    await svc.delete(admin, { columnId: doing.id });
    expect(tasks.tasks[0]?.status).toBe("TODO");
    expect(columns.columns.find(c => c.id === doing.id)).toBeUndefined();
  });

  it("bloqueia excluir última coluna", async () => {
    const { svc, columns } = setup();
    columns.columns.push({ id: "c-only", storyId: "s1", name: "ONLY", order: 1 });
    await expect(svc.delete(admin, { columnId: "c-only" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("bloqueia excluir coluna quando não existe", async () => {
    const { svc } = setup();
    await expect(svc.delete(admin, { columnId: "nope" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("bloqueia excluir coluna para MEMBER", async () => {
    const { svc, columns } = setup();
    columns.columns.push({ id: "c-only", storyId: "s1", name: "ONLY", order: 1 });
    await expect(svc.delete(member, { columnId: "c-only" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
