import type { ProjectRepository } from "../../domain/repositories";
import type { PrismaClient } from "@prisma/client";

export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: any) {
    return this.db.project.create({
      data: {
        organizationId: input.organizationId,
        clientId: input.clientId ?? null,
        name: input.name,
        code: input.code,
        summary: input.summary,
        description: input.description ?? null,
        type: input.type,
        methodology: input.methodology,
        status: input.status ?? undefined,
        health: input.health ?? undefined,
        priority: input.priority ?? undefined,
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
        allowMultipleTeams: input.allowMultipleTeams ?? undefined,
        allowMultipleBoards: input.allowMultipleBoards ?? undefined,
        financialControl: input.financialControl ?? undefined,
        visibility: input.visibility ?? undefined,
      },
      include: { client: true },
    });
  }

  async findById(id: string) {
    return this.db.project.findUnique({ where: { id }, include: { client: true } });
  }

  async findByCode(code: string) {
    return this.db.project.findUnique({ where: { code }, include: { client: true } });
  }

  async findByOrgAndName(organizationId: string, name: string) {
    return this.db.project.findUnique({
      where: {
        organizationId_name: {
          organizationId,
          name,
        },
      },
      include: { client: true },
    });
  }

  async listByOrganization(organizationId: string) {
    return this.db.project.findMany({
      where: { organizationId },
      include: { client: true },
      orderBy: { createdAt: "asc" },
    });
  }
}
