import { ProjectService } from "./projectService";
import type { AuthContext, Client, Project } from "../../domain/entities";
import type { ClientRepository, ProjectRepository } from "../../domain/repositories";

class InMemoryProjectRepo implements ProjectRepository {
  projects: Project[] = [];
  async create(input: any) {
    const project: Project = {
      id: `${this.projects.length + 1}`.padStart(36, "0"),
      organizationId: input.organizationId,
      clientId: input.clientId ?? null,
      name: input.name,
      code: input.code,
      summary: input.summary,
      description: input.description ?? null,
      type: input.type,
      methodology: input.methodology,
      status: input.status ?? "BACKLOG",
      health: input.health ?? "GREEN",
      priority: input.priority ?? "MEDIUM",
      complexity: input.complexity ?? null,
      riskLevel: input.riskLevel ?? null,
      startDate: input.startDate,
      estimatedEndDate: input.estimatedEndDate ?? null,
      actualEndDate: input.actualEndDate ?? null,
      estimatedHours: input.estimatedHours ?? null,
      actualHours: input.actualHours ?? null,
      contractValue: input.contractValue ?? null,
      billingModel: input.billingModel ?? null,
      slaHours: input.slaHours ?? null,
      estimatedBudget: input.estimatedBudget ?? null,
      actualCost: input.actualCost ?? null,
      expectedMargin: input.expectedMargin ?? null,
      actualMargin: input.actualMargin ?? null,
      mainStack: input.mainStack ?? null,
      architecture: input.architecture ?? null,
      databaseType: input.databaseType ?? null,
      cloudProvider: input.cloudProvider ?? null,
      repositoryUrl: input.repositoryUrl ?? null,
      allowMultipleTeams: input.allowMultipleTeams ?? false,
      allowMultipleBoards: input.allowMultipleBoards ?? false,
      financialControl: input.financialControl ?? false,
      visibility: input.visibility ?? "PRIVATE",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    this.projects.push(project);
    return project;
  }
  async findById(id: string) {
    return this.projects.find(p => p.id === id) ?? null;
  }
  async findByCode(code: string) {
    return this.projects.find(p => p.code === code) ?? null;
  }
  async findByOrgAndName(organizationId: string, name: string) {
    return this.projects.find(p => p.organizationId === organizationId && p.name === name) ?? null;
  }
  async listByOrganization(organizationId: string) {
    return this.projects.filter(p => p.organizationId === organizationId);
  }
}

class InMemoryClientRepo implements ClientRepository {
  clients: Client[] = [];
  async create(input: any) {
    const client: Client = {
      id: `${this.clients.length + 1}`.padStart(36, "0"),
      organizationId: input.organizationId,
      name: input.name,
      code: input.code ?? null,
    };
    this.clients.push(client);
    return client;
  }
  async findById(id: string) {
    return this.clients.find(c => c.id === id) ?? null;
  }
  async findByOrgAndName(organizationId: string, name: string) {
    return this.clients.find(c => c.organizationId === organizationId && c.name === name) ?? null;
  }
  async findByOrgAndCode(organizationId: string, code: string) {
    return this.clients.find(c => c.organizationId === organizationId && c.code === code) ?? null;
  }
  async listByOrganization(organizationId: string) {
    return this.clients.filter(c => c.organizationId === organizationId);
  }
}

describe("ProjectService", () => {
  const orgA = "22222222-2222-2222-2222-222222222222";
  const orgB = "33333333-3333-3333-3333-333333333333";

  const admin: AuthContext = {
    userId: "11111111-1111-1111-1111-111111111111",
    organizationId: orgA,
    roles: ["ORG_ADMIN"],
  };

  const member: AuthContext = {
    userId: "11111111-1111-1111-1111-111111111111",
    organizationId: orgA,
    roles: ["MEMBER"],
  };

  it("cria projeto como ORG_ADMIN", async () => {
    const repo = new InMemoryProjectRepo();
    const clients = new InMemoryClientRepo();
    const svc = new ProjectService(repo, clients);

    const project = await svc.create(admin, {
      name: "Demo",
      code: "WALM-APP-01",
      summary: "Resumo",
      type: "SAAS",
      methodology: "KANBAN",
      startDate: new Date("2026-01-01"),
    });
    expect(project.name).toBe("Demo");
    expect(project.organizationId).toBe(orgA);
  });

  it("bloqueia criação para MEMBER", async () => {
    const repo = new InMemoryProjectRepo();
    const clients = new InMemoryClientRepo();
    const svc = new ProjectService(repo, clients);

    await expect(
      svc.create(member, {
        name: "Demo",
        code: "WALM-APP-01",
        summary: "Resumo",
        type: "SAAS",
        methodology: "KANBAN",
        startDate: new Date("2026-01-01"),
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("bloqueia projeto duplicado por organização", async () => {
    const repo = new InMemoryProjectRepo();
    const clients = new InMemoryClientRepo();
    const svc = new ProjectService(repo, clients);

    await svc.create(admin, {
      name: "Demo",
      code: "WALM-APP-01",
      summary: "Resumo",
      type: "SAAS",
      methodology: "KANBAN",
      startDate: new Date("2026-01-01"),
    });
    await expect(
      svc.create(admin, {
        name: "Demo",
        code: "WALM-APP-02",
        summary: "Resumo",
        type: "SAAS",
        methodology: "KANBAN",
        startDate: new Date("2026-01-01"),
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("bloqueia código duplicado", async () => {
    const repo = new InMemoryProjectRepo();
    const clients = new InMemoryClientRepo();
    const svc = new ProjectService(repo, clients);

    await svc.create(admin, {
      name: "Demo",
      code: "WALM-APP-01",
      summary: "Resumo",
      type: "SAAS",
      methodology: "KANBAN",
      startDate: new Date("2026-01-01"),
    });

    await expect(
      svc.create(admin, {
        name: "Demo 2",
        code: "WALM-APP-01",
        summary: "Resumo",
        type: "SAAS",
        methodology: "KANBAN",
        startDate: new Date("2026-01-01"),
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("impede acesso a projeto de outra organização", async () => {
    const repo = new InMemoryProjectRepo();
    const clients = new InMemoryClientRepo();
    const svc = new ProjectService(repo, clients);

    repo.projects.push({
      id: "p1",
      organizationId: orgB,
      clientId: null,
      name: "Other",
      code: "OTHER-01",
      summary: "Resumo",
      description: null,
      type: "SAAS",
      methodology: "KANBAN",
      status: "BACKLOG",
      health: "GREEN",
      priority: "MEDIUM",
      complexity: null,
      riskLevel: null,
      startDate: new Date("2026-01-01"),
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
    });
    await expect(svc.get(admin, "p1")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
