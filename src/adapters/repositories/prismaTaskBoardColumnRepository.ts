import type { PrismaClient } from "@prisma/client";
import type { TaskBoardColumnRepository } from "../../domain/repositories";

export class PrismaTaskBoardColumnRepository implements TaskBoardColumnRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: { storyId: string; name: string; order: number }) {
    return this.db.taskBoardColumn.create({ data: input });
  }

  async update(id: string, patch: { name?: string; order?: number }) {
    return this.db.taskBoardColumn.update({ where: { id }, data: patch });
  }

  async delete(id: string) {
    await this.db.taskBoardColumn.delete({ where: { id } });
  }

  async findById(id: string) {
    return this.db.taskBoardColumn.findUnique({ where: { id } });
  }

  async findByStoryAndName(storyId: string, name: string) {
    return this.db.taskBoardColumn.findUnique({
      where: {
        storyId_name: { storyId, name },
      },
    });
  }

  async listByStory(storyId: string) {
    return this.db.taskBoardColumn.findMany({ where: { storyId }, orderBy: { order: "asc" } });
  }
}

