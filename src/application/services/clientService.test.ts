import type { AuthContext, Client } from "../../domain/entities";
import type { ClientRepository } from "../../domain/repositories";
import { ClientService } from "./clientService";

class InMemoryClientRepo implements ClientRepository {
  clients: Client[] = [];
  async create(input: any) {
    const client: Client = {
      id: `${this.clients.length + 1}`.padStart(36, "0"),
      organizationId: input.organizationId,
      name: input.name,
      code: input.code ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      instagram: input.instagram ?? null,
      linkedin: input.linkedin ?? null,
      companyName: input.companyName ?? null,
      notes: input.notes ?? null,
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

describe("ClientService", () => {
  const orgA = "22222222-2222-2222-2222-222222222222";
  const admin: AuthContext = { userId: "11111111-1111-1111-1111-111111111111", organizationId: orgA, roles: ["ORG_ADMIN"] };
  const member: AuthContext = { userId: "11111111-1111-1111-1111-111111111111", organizationId: orgA, roles: ["MEMBER"] };

  it("cria cliente como ORG_ADMIN", async () => {
    const repo = new InMemoryClientRepo();
    const svc = new ClientService(repo);
    const client = await svc.create(admin, { name: "Acme", code: "ACME" });
    expect(client.name).toBe("Acme");
    expect(client.code).toBe("ACME");
  });

  it("bloqueia criação para MEMBER", async () => {
    const repo = new InMemoryClientRepo();
    const svc = new ClientService(repo);
    await expect(svc.create(member, { name: "Acme" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("bloqueia duplicado por nome", async () => {
    const repo = new InMemoryClientRepo();
    const svc = new ClientService(repo);
    await svc.create(admin, { name: "Acme" });
    await expect(svc.create(admin, { name: "Acme" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("bloqueia duplicado por código quando informado", async () => {
    const repo = new InMemoryClientRepo();
    const svc = new ClientService(repo);
    await svc.create(admin, { name: "Acme", code: "ACME" });
    await expect(svc.create(admin, { name: "Acme2", code: "ACME" })).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
