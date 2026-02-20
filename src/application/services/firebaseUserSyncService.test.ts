import type { Organization, Unit, User } from "../../domain/entities";
import type { OrganizationRepository, UnitRepository, UserRepository } from "../../domain/repositories";
import { FirebaseUserSyncService } from "./firebaseUserSyncService";

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

class InMemoryUnits implements UnitRepository {
  units: Unit[] = [];
  async create(input: { organizationId: string; name: string; phone?: string | null; address?: string | null }) {
    const now = new Date();
    const unit: Unit = {
      id: `unit-${this.units.length + 1}`.padStart(36, "0"),
      organizationId: input.organizationId,
      name: input.name,
      phone: input.phone ?? null,
      address: input.address ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.units.push(unit);
    return unit;
  }
  async update(id: string, patch: Partial<Unit>) {
    const u = this.units.find(x => x.id === id);
    if (!u) throw new Error("not found");
    Object.assign(u, patch);
    return u;
  }
  async delete(_id: string) {}
  async findById(id: string) {
    return this.units.find(u => u.id === id) ?? null;
  }
  async listByOrganization(organizationId: string) {
    return this.units.filter(u => u.organizationId === organizationId);
  }
  async countByOrganization(organizationId: string) {
    return this.units.filter(u => u.organizationId === organizationId).length;
  }
}

class InMemoryUsers implements UserRepository {
  users: User[] = [];
  async create(input: any) {
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
    if (patch.organizationId) user.organizationId = patch.organizationId;
    return user;
  }
  async listByOrganization(organizationId: string) {
    return this.users.filter(u => u.organizationId === organizationId);
  }
}

describe("FirebaseUserSyncService", () => {
  it("cria usuário e vincula firebaseUid", async () => {
    process.env.DEFAULT_ORGANIZATION_NAME = "Company";
    const orgs = new InMemoryOrganizations();
    const units = new InMemoryUnits();
    const users = new InMemoryUsers();
    const svc = new FirebaseUserSyncService(orgs, users, units);

    const user = await svc.sync({ firebaseUid: "firebase_123", email: "USER@A.COM" });
    expect(user.email).toBe("user@a.com");
    expect(user.firebaseUid).toBe("firebase_123");
    expect(user.passwordHash).toBeNull();
    expect(user.roles).toEqual(["ORG_ADMIN"]);
    expect(user.unitId).toBeTruthy();
    expect(orgs.orgs[0]?.name).toBe("Company");
  });

  it("associa firebaseUid ao usuário existente por email", async () => {
    const orgs = new InMemoryOrganizations();
    const units = new InMemoryUnits();
    const users = new InMemoryUsers();
    const svc = new FirebaseUserSyncService(orgs, users, units);

    const org = await orgs.create({ name: "Company" });
    const unit = await units.create({ organizationId: org.id, name: "Unidade principal" });
    const existing = await users.create({
      organizationId: org.id,
      unitId: unit.id,
      email: "user@a.com",
      passwordHash: null,
      firebaseUid: null,
      roles: ["MEMBER"],
    });
    expect(existing.firebaseUid).toBeNull();

    const synced = await svc.sync({ firebaseUid: "firebase_123", email: "user@a.com" });
    expect(synced.id).toBe(existing.id);
    expect(synced.firebaseUid).toBe("firebase_123");
  });

  it("falha se email estiver vinculado a outro firebaseUid", async () => {
    const orgs = new InMemoryOrganizations();
    const units = new InMemoryUnits();
    const users = new InMemoryUsers();
    const svc = new FirebaseUserSyncService(orgs, users, units);

    const org = await orgs.create({ name: "Company" });
    const unit = await units.create({ organizationId: org.id, name: "Unidade principal" });
    await users.create({
      organizationId: org.id,
      unitId: unit.id,
      email: "user@a.com",
      firebaseUid: "firebase_old",
      passwordHash: null,
      roles: ["MEMBER"],
    });
    await expect(svc.sync({ firebaseUid: "firebase_new", email: "user@a.com" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("retorna usuário já existente por firebaseUid", async () => {
    const orgs = new InMemoryOrganizations();
    const units = new InMemoryUnits();
    const users = new InMemoryUsers();
    const svc = new FirebaseUserSyncService(orgs, users, units);

    const org = await orgs.create({ name: "Company" });
    const unit = await units.create({ organizationId: org.id, name: "Unidade principal" });
    await users.create({
      organizationId: org.id,
      unitId: unit.id,
      email: "user@a.com",
      firebaseUid: "firebase_123",
      passwordHash: null,
      roles: ["MEMBER"],
    });
    const result = await svc.sync({ firebaseUid: "firebase_123", email: "other@a.com" });
    expect(result.email).toBe("user@a.com");
  });
});
