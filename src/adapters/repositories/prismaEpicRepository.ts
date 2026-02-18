import type { PrismaClient } from "@prisma/client";
import type { EpicRepository } from "../../domain/repositories";

export class PrismaEpicRepository implements EpicRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: {
    projectId: string;
    title: string;
    context?: string | null;
    expected?: string | null;
    status?: string;
  }) {
    return this.db.epic.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        context: input.context ?? null,
        expected: input.expected ?? null,
        status: input.status ?? "TODO",
      },
    });
  }

  async update(id: string, patch: { title?: string; context?: string | null; expected?: string | null; status?: string }) {
    return this.db.epic.update({
      where: { id },
      data: patch,
    });
  }

  async delete(id: string) {
    await this.db.epic.delete({ where: { id } });
  }

  async findById(id: string) {
    return this.db.epic.findUnique({ where: { id } });
  }

  async findByProjectAndTitle(projectId: string, title: string) {
    return this.db.epic.findUnique({
      where: {
        projectId_title: {
          projectId,
          title,
        },
      },
    });
  }

  async listByProject(projectId: string) {
    return this.db.epic.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });
  }
}

