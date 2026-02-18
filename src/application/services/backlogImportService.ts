import type { AuthContext } from "../../domain/entities";
import { ForbiddenError, NotFoundError } from "../../domain/errors";
import type { EpicRepository, ProjectRepository, StoryRepository, TaskRepository } from "../../domain/repositories";

type ImportReport = {
  epicsCreated: number;
  epicsIgnored: number;
  storiesCreated: number;
  storiesIgnored: number;
  tasksCreated: number;
  tasksIgnored: number;
};

type ParsedStory = {
  title: string;
  userStory: string;
  acceptanceCriteria: string;
  tasks: { title: string }[];
};

type ParsedEpic = {
  title: string;
  stories: ParsedStory[];
};

function parseMarkdownToBacklog(markdown: string): ParsedEpic[] {
  const lines = markdown.split(/\r?\n/);
  const epics: ParsedEpic[] = [];

  let currentEpic: ParsedEpic | null = null;
  let currentStory: ParsedStory | null = null;
  let storyBuffer: string[] = [];

  const flushStoryBuffer = () => {
    if (!currentStory) return;
    const content = storyBuffer.join("\n").trim();
    const userStoryMatch =
      content.match(/Eu como[\s\S]*?(?=\n\n|$)/i) ??
      content.match(/\*\*Eu como\*\*[\s\S]*?(?=\n\n|$)/i) ??
      null;

    const acceptanceLines = content
      .split("\n")
      .filter(l => /Dado que|Quando|Então/i.test(l))
      .join("\n")
      .trim();

    currentStory.userStory = (userStoryMatch?.[0]?.trim() ?? content.slice(0, 500)).trim();
    currentStory.acceptanceCriteria = (acceptanceLines || content).trim();
    storyBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("## ") && !line.startsWith("### ")) {
      flushStoryBuffer();
      currentStory = null;
      const title = line.replace(/^##\s+/, "").trim();
      if (!title) continue;
      currentEpic = { title, stories: [] };
      epics.push(currentEpic);
      continue;
    }

    if (line.startsWith("### ") && !line.startsWith("#### ")) {
      flushStoryBuffer();
      const title = line.replace(/^###\s+/, "").trim();
      if (!title) continue;
      if (!currentEpic) {
        currentEpic = { title: "Epic (Auto)", stories: [] };
        epics.push(currentEpic);
      }
      currentStory = { title, userStory: "", acceptanceCriteria: "", tasks: [] };
      currentEpic.stories.push(currentStory);
      continue;
    }

    if (line.startsWith("#### ")) {
      const title = line.replace(/^####\s+/, "").trim();
      if (!title) continue;
      if (!currentEpic) {
        currentEpic = { title: "Epic (Auto)", stories: [] };
        epics.push(currentEpic);
      }
      if (!currentStory) {
        currentStory = {
          title: "Story (Auto)",
          userStory: "",
          acceptanceCriteria: "",
          tasks: [],
        };
        currentEpic.stories.push(currentStory);
      }
      currentStory.tasks.push({ title });
      continue;
    }

    if (currentStory) storyBuffer.push(rawLine);
  }

  flushStoryBuffer();
  return epics.filter(e => e.title && e.stories.length > 0);
}

export class BacklogImportService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly epics: EpicRepository,
    private readonly stories: StoryRepository,
    private readonly tasks: TaskRepository,
  ) {}

  async importMarkdown(auth: AuthContext, projectId: string, markdown: string): Promise<ImportReport> {
    const project = await this.projects.findById(projectId);
    if (!project) throw new NotFoundError("Projeto não encontrado");
    if (project.organizationId !== auth.organizationId) throw new ForbiddenError();

    const parsedEpics = parseMarkdownToBacklog(markdown);

    const report: ImportReport = {
      epicsCreated: 0,
      epicsIgnored: 0,
      storiesCreated: 0,
      storiesIgnored: 0,
      tasksCreated: 0,
      tasksIgnored: 0,
    };

    for (const epicBlock of parsedEpics) {
      let epic = await this.epics.findByProjectAndTitle(projectId, epicBlock.title);
      if (!epic) {
        epic = await this.epics.create({
          projectId,
          title: epicBlock.title,
          status: "TODO",
          context: null,
          expected: null,
        });
        report.epicsCreated += 1;
      } else {
        report.epicsIgnored += 1;
      }

      for (const storyBlock of epicBlock.stories) {
        let story = await this.stories.findByEpicAndTitle(epic.id, storyBlock.title);
        if (!story) {
          story = await this.stories.create({
            epicId: epic.id,
            title: storyBlock.title,
            userStory: storyBlock.userStory,
            acceptanceCriteria: storyBlock.acceptanceCriteria,
            status: "TODO",
            points: null,
          });
          report.storiesCreated += 1;
        } else {
          report.storiesIgnored += 1;
        }

        for (const taskBlock of storyBlock.tasks) {
          const existingTask = await this.tasks.findByStoryAndTitle(story.id, taskBlock.title);
          if (existingTask) {
            report.tasksIgnored += 1;
            continue;
          }
          await this.tasks.create({
            storyId: story.id,
            title: taskBlock.title,
            description: null,
            status: "TODO",
          });
          report.tasksCreated += 1;
        }
      }
    }

    return report;
  }
}

