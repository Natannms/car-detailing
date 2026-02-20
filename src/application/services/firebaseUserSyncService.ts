import type { OrganizationRepository, UnitRepository, UserRepository } from "../../domain/repositories";
import { ConflictError, UnauthorizedError } from "../../domain/errors";

export class FirebaseUserSyncService {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly users: UserRepository,
    private readonly units: UnitRepository,
  ) {}

  async sync(input: { firebaseUid: string; email: string }) {
    const firebaseUid = input.firebaseUid.trim();
    const email = input.email.trim().toLowerCase();
    if (!firebaseUid || !email) throw new UnauthorizedError("Sessão inválida");

    const ensureUnit = async (organizationId: string) => {
      const units = await this.units.listByOrganization(organizationId);
      return (
        units[0] ??
        (await this.units.create({
          organizationId,
          name: "Unidade principal",
          phone: null,
          address: null,
        }))
      );
    };

    const existingByFirebase = await this.users.findByFirebaseUid(firebaseUid);
    if (existingByFirebase) {
      if (!existingByFirebase.unitId) {
        const u = await ensureUnit(existingByFirebase.organizationId);
        return this.users.update(existingByFirebase.id, { unitId: u.id });
      }
      return existingByFirebase;
    }

    const existingByEmail = await this.users.findByEmail(email);
    if (existingByEmail) {
      if (existingByEmail.firebaseUid && existingByEmail.firebaseUid !== firebaseUid) {
        throw new ConflictError("Email já vinculado a outro usuário");
      }
      const attached = await this.users.attachFirebaseUid(existingByEmail.id, firebaseUid);
      if (!attached.unitId) {
        const u = await ensureUnit(attached.organizationId);
        return this.users.update(attached.id, { unitId: u.id });
      }
      return attached;
    }

    const orgName = (process.env.DEFAULT_ORGANIZATION_NAME || "Company").trim() || "Company";
    const organization = (await this.organizations.findByName(orgName)) ?? (await this.organizations.create({ name: orgName }));

    const defaultUnit = await ensureUnit(organization.id);

    const existingMembers = await this.users.listByOrganization(organization.id);
    const roles: ("ORG_ADMIN" | "MEMBER")[] = existingMembers.length === 0 ? ["ORG_ADMIN"] : ["MEMBER"];

    return this.users.create({
      organizationId: organization.id,
      unitId: defaultUnit.id,
      email,
      passwordHash: null,
      firebaseUid,
      roles,
    });
  }
}
