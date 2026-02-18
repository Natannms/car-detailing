import type { OrganizationRepository, UserRepository } from "../../domain/repositories";
import { ConflictError, UnauthorizedError } from "../../domain/errors";

export class ClerkUserSyncService {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly users: UserRepository,
  ) {}

  async sync(input: { clerkUserId: string; email: string }) {
    const clerkUserId = input.clerkUserId.trim();
    const email = input.email.trim().toLowerCase();
    if (!clerkUserId || !email) throw new UnauthorizedError("Sessão inválida");

    const existingByClerk = await this.users.findByClerkUserId(clerkUserId);
    if (existingByClerk) return existingByClerk;

    const existingByEmail = await this.users.findByEmail(email);
    if (existingByEmail) {
      if (existingByEmail.clerkUserId && existingByEmail.clerkUserId !== clerkUserId) {
        throw new ConflictError("Email já vinculado a outro usuário");
      }
      return this.users.attachClerkUserId(existingByEmail.id, clerkUserId);
    }

    const orgName = (process.env.DEFAULT_ORGANIZATION_NAME || "Company").trim() || "Company";
    const organization = (await this.organizations.findByName(orgName)) ?? (await this.organizations.create({ name: orgName }));

    const existingMembers = await this.users.listByOrganization(organization.id);
    const roles: ("ORG_ADMIN" | "MEMBER")[] = existingMembers.length === 0 ? ["ORG_ADMIN"] : ["MEMBER"];

    return this.users.create({
      organizationId: organization.id,
      email,
      passwordHash: null,
      clerkUserId,
      roles,
    });
  }
}
