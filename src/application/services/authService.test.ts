import type { AuthContext, Organization, User } from "../../domain/entities";
import type { OrganizationRepository, UserRepository } from "../../domain/repositories";
import { AuthService } from "./authService";

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
  async create(input: {
    organizationId: string;
    email: string;
    passwordHash?: string | null;
    firebaseUid?: string | null;
    unitId?: string | null;
    roles: ("ORG_ADMIN" | "MEMBER")[];
  }) {
    const user: User = {
      id: `user-${this.users.length + 1}`.padStart(36, "0"),
      organizationId: input.organizationId,
      unitId: input.unitId ?? null,
      email: input.email,
      passwordHash: input.passwordHash ?? null,
      firebaseUid: input.firebaseUid ?? null,
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
  async findByFirebaseUid(firebaseUid: string) {
    return this.users.find(u => u.firebaseUid === firebaseUid) ?? null;
  }
  async attachFirebaseUid(id: string, firebaseUid: string) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error("not found");
    user.firebaseUid = firebaseUid;
    return user;
  }
  async update(id: string, patch: Partial<Pick<User, "organizationId" | "roles" | "unitId">>) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error("not found");
    if (patch.unitId !== undefined) user.unitId = patch.unitId;
    if (patch.roles) user.roles = patch.roles;
    if (patch.organizationId) user.organizationId = patch.organizationId!;
    return user;
  }
  async listByOrganization(organizationId: string) {
    return this.users.filter(u => u.organizationId === organizationId);
  }
}

describe("AuthService", () => {
  it("registra ORG_ADMIN e cria organização", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const svc = new AuthService(orgs, users);

    const result = await svc.registerOwner({ organizationName: "Org", email: "admin@a.com", password: "password123" });
    expect(result.organization.name).toBe("Org");
    expect(result.user.email).toBe("admin@a.com");
    expect(result.user.roles).toEqual(["ORG_ADMIN"]);
  });

  it("bloqueia email duplicado", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const svc = new AuthService(orgs, users);

    await svc.registerOwner({ organizationName: "Org", email: "admin@a.com", password: "password123" });
    await expect(svc.registerOwner({ organizationName: "Org2", email: "admin@a.com", password: "password123" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("login valida senha", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const svc = new AuthService(orgs, users);

    await svc.registerOwner({ organizationName: "Org", email: "admin@a.com", password: "password123" });
    await expect(svc.login({ email: "admin@a.com", password: "wrong" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const { user } = await svc.login({ email: "admin@a.com", password: "password123" });
    expect(user.email).toBe("admin@a.com");
  });

  it("login falha quando usuário não existe", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const svc = new AuthService(orgs, users);

    await expect(svc.login({ email: "missing@a.com", password: "password123" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("me valida org do contexto", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const svc = new AuthService(orgs, users);

    const { user } = await svc.registerOwner({ organizationName: "Org", email: "admin@a.com", password: "password123" });
    const auth: AuthContext = { userId: user.id, organizationId: user.organizationId, roles: ["ORG_ADMIN"] };
    const me = await svc.me(auth);
    expect(me.user.id).toBe(user.id);
  });

  it("me bloqueia quando org do token não bate com usuário", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const svc = new AuthService(orgs, users);

    const { user } = await svc.registerOwner({ organizationName: "Org", email: "admin@a.com", password: "password123" });
    const auth: AuthContext = { userId: user.id, organizationId: "other-org", roles: ["ORG_ADMIN"] };
    await expect(svc.me(auth)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("registra MEMBER em organização existente", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const svc = new AuthService(orgs, users);

    const org = await orgs.create({ name: "Org" });
    const result = await svc.registerMemberFromInvite({ organizationId: org.id, email: "m@a.com", password: "password123" });
    expect(result.user.roles).toEqual(["MEMBER"]);
    expect(result.user.organizationId).toBe(org.id);
  });
});
