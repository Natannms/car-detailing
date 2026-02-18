import { PrismaEpicRepository } from "../adapters/repositories/prismaEpicRepository";
import { PrismaInviteTokenRepository } from "../adapters/repositories/prismaInviteTokenRepository";
import { PrismaClientRepository } from "../adapters/repositories/prismaClientRepository";
import { PrismaOrganizationRepository } from "../adapters/repositories/prismaOrganizationRepository";
import { PrismaProjectRepository } from "../adapters/repositories/prismaProjectRepository";
import { PrismaStoryRepository } from "../adapters/repositories/prismaStoryRepository";
import { PrismaTaskBoardColumnRepository } from "../adapters/repositories/prismaTaskBoardColumnRepository";
import { PrismaTaskRepository } from "../adapters/repositories/prismaTaskRepository";
import { PrismaUserRepository } from "../adapters/repositories/prismaUserRepository";
import { AuthService } from "../application/services/authService";
import { EpicService } from "../application/services/epicService";
import { BacklogImportService } from "../application/services/backlogImportService";
import { InviteService } from "../application/services/inviteService";
import { ClerkUserSyncService } from "../application/services/clerkUserSyncService";
import { ClientService } from "../application/services/clientService";
import { ProjectService } from "../application/services/projectService";
import { StoryService } from "../application/services/storyService";
import { TaskService } from "../application/services/taskService";
import { TaskBoardColumnService } from "../application/services/taskBoardColumnService";
import { prisma } from "./database/prisma";

export const repositories = {
  organizations: new PrismaOrganizationRepository(prisma),
  users: new PrismaUserRepository(prisma),
  invites: new PrismaInviteTokenRepository(prisma),
  clients: new PrismaClientRepository(prisma),
  projects: new PrismaProjectRepository(prisma),
  epics: new PrismaEpicRepository(prisma),
  stories: new PrismaStoryRepository(prisma),
  tasks: new PrismaTaskRepository(prisma),
  taskBoardColumns: new PrismaTaskBoardColumnRepository(prisma),
};

export const services = {
  auth: new AuthService(repositories.organizations, repositories.users),
  clerkSync: new ClerkUserSyncService(repositories.organizations, repositories.users),
  invites: new InviteService(repositories.organizations, repositories.users, repositories.invites),
  clients: new ClientService(repositories.clients),
  projects: new ProjectService(repositories.projects, repositories.clients),
  epics: new EpicService(repositories.projects, repositories.epics),
  stories: new StoryService(repositories.projects, repositories.epics, repositories.stories),
  tasks: new TaskService(repositories.projects, repositories.epics, repositories.stories, repositories.tasks),
  taskBoardColumns: new TaskBoardColumnService(
    repositories.projects,
    repositories.epics,
    repositories.stories,
    repositories.tasks,
    repositories.taskBoardColumns,
  ),
  backlogImport: new BacklogImportService(repositories.projects, repositories.epics, repositories.stories, repositories.tasks),
};
