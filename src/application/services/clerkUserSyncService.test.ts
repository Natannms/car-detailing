import type { Organization, User } from "../../domain/entities";
import type { OrganizationRepository, UserRepository } from "../../domain/repositories";
import { ClerkUserSyncService } from "./clerkUserSyncService";

class InMemoryOrganizations implements OrganizationRepository {
  orgs: Organization[] = [];
  async create(input: { name: string }) {
    const org: Organization = { id: `org-${this.orgs.length + 1}`.padStart(36, "0"), name: input.name };
    this.orgs.push(org);
    return org;
  }
  async findById(id: string) {
    return this.orgs.find(o => o.id === id) ?? null;
  }
  async findByName(name: string) {
    return this.orgs.find(o => o.name === name) ?? null;
  }
}

class InMemoryUsers implements UserRepository {
  users: User[] = [];
  async create(input: any) {
    const user: User = {
      id: `user-${this.users.length + 1}`.padStart(36, "0"),
      organizationId: input.organizationId,
      email: input.email,
      passwordHash: input.passwordHash ?? null,
      clerkUserId: input.clerkUserId ?? null,
      roles: input.roles,
    };
    this.users.push(user);
    return user;
  }
  async findById(id: string) {
    return this.users.find(u => u.id === id) ?? null;
  }
  async findByEmail(email: string) {
    return this.users.find(u => u.email === email) ?? null;
  }
  async findByClerkUserId(clerkUserId: string) {
    return this.users.find(u => u.clerkUserId === clerkUserId) ?? null;
  }
  async attachClerkUserId(id: string, clerkUserId: string) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error("not found");
    user.clerkUserId = clerkUserId;
    return user;
  }
  async listByOrganization(organizationId: string) {
    return this.users.filter(u => u.organizationId === organizationId);
  }
}

describe("ClerkUserSyncService", () => {
  it("cria usuário e vincula clerkUserId", async () => {
    process.env.DEFAULT_ORGANIZATION_NAME = "Company";
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const svc = new ClerkUserSyncService(orgs, users);

    const user = await svc.sync({ clerkUserId: "clerk_123", email: "USER@A.COM" });
    expect(user.email).toBe("user@a.com");
    expect(user.clerkUserId).toBe("clerk_123");
    expect(user.passwordHash).toBeNull();
    expect(user.roles).toEqual(["ORG_ADMIN"]);
    expect(orgs.orgs[0]?.name).toBe("Company");
  });

  it("associa clerkUserId ao usuário existente por email", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const svc = new ClerkUserSyncService(orgs, users);

    const org = await orgs.create({ name: "Company" });
    const existing = await users.create({ organizationId: org.id, email: "user@a.com", passwordHash: null, roles: ["MEMBER"] });
    expect(existing.clerkUserId).toBeNull();

    const synced = await svc.sync({ clerkUserId: "clerk_123", email: "user@a.com" });
    expect(synced.id).toBe(existing.id);
    expect(synced.clerkUserId).toBe("clerk_123");
  });

  it("falha se email estiver vinculado a outro clerkUserId", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const svc = new ClerkUserSyncService(orgs, users);

    const org = await orgs.create({ name: "Company" });
    await users.create({ organizationId: org.id, email: "user@a.com", clerkUserId: "clerk_old", passwordHash: null, roles: ["MEMBER"] });
    await expect(svc.sync({ clerkUserId: "clerk_new", email: "user@a.com" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("retorna usuário já existente por clerkUserId", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const svc = new ClerkUserSyncService(orgs, users);

    const org = await orgs.create({ name: "Company" });
    await users.create({ organizationId: org.id, email: "user@a.com", clerkUserId: "clerk_123", passwordHash: null, roles: ["MEMBER"] });
    const result = await svc.sync({ clerkUserId: "clerk_123", email: "other@a.com" });
    expect(result.email).toBe("user@a.com");
  });
});

