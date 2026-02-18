import { EpicService } from "./epicService";
import type { AuthContext, Epic, Project } from "../../domain/entities";
import type { EpicRepository, ProjectRepository } from "../../domain/repositories";

class InMemoryProjectRepo implements ProjectRepository {
  projects: Project[] = [];
  async create(input: { organizationId: string; name: string }) {
    const project: Project = {
      id: `p-${this.projects.length + 1}`,
      organizationId: input.organizationId,
      name: input.name,
    };
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
    const epic: Epic = {
      id: `e-${this.epics.length + 1}`,
      projectId: input.projectId,
      title: input.title,
      context: input.context ?? null,
      expected: input.expected ?? null,
      status: input.status ?? "TODO",
    };
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

describe("EpicService", () => {
  const auth: AuthContext = {
    userId: "11111111-1111-1111-1111-111111111111",
    organizationId: "22222222-2222-2222-2222-222222222222",
    roles: ["ORG_ADMIN"],
  };

  it("cria e lista épicos por projeto", async () => {
    const projects = new InMemoryProjectRepo();
    const epics = new InMemoryEpicRepo();
    projects.projects.push({ id: "p1", organizationId: auth.organizationId, name: "Demo" });

    const svc = new EpicService(projects, epics);

    const created = await svc.create(auth, { projectId: "p1", title: "Epic 1" });
    expect(created.title).toBe("Epic 1");

    const list = await svc.list(auth, "p1");
    expect(list).toHaveLength(1);
  });

  it("bloqueia épico duplicado no mesmo projeto", async () => {
    const projects = new InMemoryProjectRepo();
    const epics = new InMemoryEpicRepo();
    projects.projects.push({ id: "p1", organizationId: auth.organizationId, name: "Demo" });

    const svc = new EpicService(projects, epics);
    await svc.create(auth, { projectId: "p1", title: "Epic 1" });
    await expect(svc.create(auth, { projectId: "p1", title: "Epic 1" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("atualiza e remove épico", async () => {
    const projects = new InMemoryProjectRepo();
    const epics = new InMemoryEpicRepo();
    projects.projects.push({ id: "p1", organizationId: auth.organizationId, name: "Demo" });

    const svc = new EpicService(projects, epics);
    const created = await svc.create(auth, { projectId: "p1", title: "Epic 1" });
    const updated = await svc.update(auth, created.id, { title: "Epic 1 - Updated" });
    expect(updated.title).toBe("Epic 1 - Updated");

    await svc.delete(auth, created.id);
    await expect(svc.get(auth, created.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
