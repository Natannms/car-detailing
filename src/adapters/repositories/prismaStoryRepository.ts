import type { PrismaClient } from "@prisma/client";
import type { StoryRepository } from "../../domain/repositories";

export class PrismaStoryRepository implements StoryRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: {
    epicId: string;
    title: string;
    userStory: string;
    acceptanceCriteria: string;
    status?: string;
    points?: number | null;
  }) {
    return this.db.story.create({
      data: {
        epicId: input.epicId,
        title: input.title,
        userStory: input.userStory,
        acceptanceCriteria: input.acceptanceCriteria,
        status: input.status ?? "TODO",
        points: input.points ?? null,
      },
    });
  }

  async update(
    id: string,
    patch: { title?: string; userStory?: string; acceptanceCriteria?: string; status?: string; points?: number | null },
  ) {
    return this.db.story.update({ where: { id }, data: patch });
  }

  async delete(id: string) {
    await this.db.story.delete({ where: { id } });
  }

  async findById(id: string) {
    return this.db.story.findUnique({ where: { id } });
  }

  async findByEpicAndTitle(epicId: string, title: string) {
    return this.db.story.findUnique({
      where: {
        epicId_title: {
          epicId,
          title,
        },
      },
    });
  }

  async listByEpic(epicId: string) {
    return this.db.story.findMany({
      where: { epicId },
      orderBy: { createdAt: "asc" },
    });
  }
}

