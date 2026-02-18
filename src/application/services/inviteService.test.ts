import type { AuthContext, InviteToken, Organization, User } from "../../domain/entities";
import type { InviteTokenRepository, OrganizationRepository, UserRepository } from "../../domain/repositories";
import { InviteService } from "./inviteService";

class InMemoryOrganizations implements OrganizationRepository {
  orgs: Organization[] = [];
  async create(input: { name: string }) {
    const org: Organization = { id: `org-${this.orgs.length + 1}`, name: input.name };
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
      id: `user-${this.users.length + 1}`,
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

class InMemoryInvites implements InviteTokenRepository {
  invites: InviteToken[] = [];
  async create(input: any) {
    const invite: InviteToken = {
      id: `inv-${this.invites.length + 1}`,
      organizationId: input.organizationId,
      tokenHash: input.tokenHash,
      roleToGrant: "MEMBER",
      emailHint: input.emailHint ?? null,
      expiresAt: input.expiresAt,
      usedAt: null,
      usedByUserId: null,
      createdByUserId: input.createdByUserId,
    };
    this.invites.push(invite);
    return invite;
  }
  async findByTokenHash(tokenHash: string) {
    return this.invites.find(i => i.tokenHash === tokenHash) ?? null;
  }
  async markUsed(id: string, usedAt: Date, usedByUserId: string) {
    const invite = this.invites.find(i => i.id === id);
    if (!invite) return;
    invite.usedAt = usedAt;
    invite.usedByUserId = usedByUserId;
  }
  async listByOrganization(organizationId: string) {
    return this.invites.filter(i => i.organizationId === organizationId);
  }
  async revoke(id: string) {
    this.invites = this.invites.filter(i => i.id !== id);
  }
}

describe("InviteService", () => {
  it("ORG_ADMIN cria convite e preview retorna organização", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const invites = new InMemoryInvites();

    const org = await orgs.create({ name: "Org" });
    const admin: AuthContext = { userId: "u1", organizationId: org.id, roles: ["ORG_ADMIN"] };

    const svc = new InviteService(orgs, users, invites);
    const created = await svc.createInvite(admin, { emailHint: "m@a.com", expiresInDays: 7 });
    expect(created.organization.id).toBe(org.id);
    expect(created.rawToken).toBeTruthy();

    const preview = await svc.previewInvite(created.rawToken);
    expect(preview.organization.name).toBe("Org");
    expect(preview.invite.emailHint).toBe("m@a.com");
  });

  it("bloqueia criação para MEMBER", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const invites = new InMemoryInvites();
    const org = await orgs.create({ name: "Org" });

    const svc = new InviteService(orgs, users, invites);
    await expect(svc.createInvite({ userId: "u1", organizationId: org.id, roles: ["MEMBER"] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("recusa preview expirado", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const invites = new InMemoryInvites();
    const org = await orgs.create({ name: "Org" });

    const svc = new InviteService(orgs, users, invites);
    const created = await svc.createInvite({ userId: "u1", organizationId: org.id, roles: ["ORG_ADMIN"] }, { expiresInDays: 1 });
    const invite = await invites.findByTokenHash(created.invite.tokenHash);
    if (invite) invite.expiresAt = new Date(Date.now() - 1000);
    await expect(svc.previewInvite(created.rawToken)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("recusa preview quando já usado", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const invites = new InMemoryInvites();
    const org = await orgs.create({ name: "Org" });

    const svc = new InviteService(orgs, users, invites);
    const created = await svc.createInvite({ userId: "u1", organizationId: org.id, roles: ["ORG_ADMIN"] });
    await invites.markUsed(created.invite.id, new Date(), "u2");
    await expect(svc.previewInvite(created.rawToken)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("listInvites e revoke funcionam para ORG_ADMIN", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const invites = new InMemoryInvites();
    const org = await orgs.create({ name: "Org" });
    const auth: AuthContext = { userId: "u1", organizationId: org.id, roles: ["ORG_ADMIN"] };

    const svc = new InviteService(orgs, users, invites);
    const created = await svc.createInvite(auth);
    const list = await svc.listInvites(auth);
    expect(list).toHaveLength(1);

    await svc.revokeInvite(auth, created.invite.id);
    const list2 = await svc.listInvites(auth);
    expect(list2).toHaveLength(0);
  });

  it("listMembers bloqueia MEMBER", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const invites = new InMemoryInvites();
    const org = await orgs.create({ name: "Org" });
    const auth: AuthContext = { userId: "u1", organizationId: org.id, roles: ["MEMBER"] };

    const svc = new InviteService(orgs, users, invites);
    await expect(svc.listMembers(auth)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("redeemInvite recusa quando email já existe", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const invites = new InMemoryInvites();
    const org = await orgs.create({ name: "Org" });

    users.users.push({ id: "u2", organizationId: org.id, email: "m@a.com", passwordHash: "x", clerkUserId: null, roles: ["MEMBER"] });

    const svc = new InviteService(orgs, users, invites);
    const created = await svc.createInvite({ userId: "u1", organizationId: org.id, roles: ["ORG_ADMIN"] });
    await expect(svc.redeemInvite(created.rawToken, { email: "m@a.com", password: "password123" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("previewInvite retorna NOT_FOUND para token inexistente", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const invites = new InMemoryInvites();
    const svc = new InviteService(orgs, users, invites);

    await expect(svc.previewInvite("missing")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("createInvite retorna NOT_FOUND quando organização não existe", async () => {
    const orgs = new InMemoryOrganizations();
    const users = new InMemoryUsers();
    const invites = new InMemoryInvites();
    const svc = new InviteService(orgs, users, invites);

    await expect(svc.createInvite({ userId: "u1", organizationId: "org-missing", roles: ["ORG_ADMIN"] })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
