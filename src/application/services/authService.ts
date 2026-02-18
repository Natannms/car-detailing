import bcrypt from "bcryptjs";
import type { AuthContext } from "../../domain/entities";
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "../../domain/errors";
import type { OrganizationRepository, UserRepository } from "../../domain/repositories";

export class AuthService {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly users: UserRepository,
  ) {}

  async registerOwner(input: { email: string; password: string; organizationName?: string }) {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new ConflictError("Email já cadastrado");

    const organizationName = input.organizationName?.trim()
      ? input.organizationName.trim()
      : `Org de ${input.email.trim().toLowerCase()}`;
    const organization = await this.organizations.create({ name: organizationName });
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.users.create({
      organizationId: organization.id,
      email: input.email,
      passwordHash,
      roles: ["ORG_ADMIN"],
    });

    return { organization, user };
  }

  async registerMemberFromInvite(input: { organizationId: string; email: string; password: string }) {
    const org = await this.organizations.findById(input.organizationId);
    if (!org) throw new NotFoundError("Organização não encontrada");

    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new ConflictError("Email já cadastrado");

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.users.create({
      organizationId: input.organizationId,
      email: input.email,
      passwordHash,
      roles: ["MEMBER"],
    });

    return { organization: org, user };
  }

  async login(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email);
    if (!user) throw new UnauthorizedError("Credenciais inválidas");
    if (!user.passwordHash) throw new UnauthorizedError("Credenciais inválidas");

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError("Credenciais inválidas");

    return { user };
  }

  async me(auth: AuthContext) {
    const user = await this.users.findById(auth.userId);
    if (!user) throw new UnauthorizedError("Sessão inválida");
    if (user.organizationId !== auth.organizationId) throw new ForbiddenError();
    return { user };
  }
}
