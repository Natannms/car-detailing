import type { PrismaClient } from "@prisma/client";
import type { TaskRepository } from "../../domain/repositories";

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: { storyId: string; title: string; description?: string | null; status?: string }) {
    return this.db.task.create({
      data: {
        storyId: input.storyId,
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? "TODO",
      },
    });
  }

  async update(id: string, patch: { title?: string; description?: string | null; status?: string }) {
    return this.db.task.update({ where: { id }, data: patch });
  }

  async delete(id: string) {
    await this.db.task.delete({ where: { id } });
  }

  async findById(id: string) {
    return this.db.task.findUnique({ where: { id } });
  }

  async findByStoryAndTitle(storyId: string, title: string) {
    return this.db.task.findUnique({
      where: {
        storyId_title: {
          storyId,
          title,
        },
      },
    });
  }

  async listByStory(storyId: string) {
    return this.db.task.findMany({
      where: { storyId },
      orderBy: { createdAt: "asc" },
    });
  }
}

