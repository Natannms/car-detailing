import { randomUUID } from "crypto";
import type { ProjectRepository } from "../../domain/repositories";
import { firestore } from "../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../infrastructure/firebase/converters";

type ProjectDoc = any;

export class FirebaseProjectRepository implements ProjectRepository {
  private projects() {
    return firestore().collection("projects");
  }

  private clients() {
    return firestore().collection("clients");
  }

  private async attachClient(project: any) {
    if (!project.clientId) return { ...project, client: null };
    const snap = await this.clients().doc(project.clientId).get();
    if (!snap.exists) return { ...project, client: null };
    const d = snap.data() as any;
    return {
      ...project,
      client: {
        id: d.id ?? snap.id,
        organizationId: d.organizationId,
        name: d.name,
        code: d.code ?? null,
        email: d.email ?? null,
        phone: d.phone ?? null,
        address: d.address ?? null,
        instagram: d.instagram ?? null,
        linkedin: d.linkedin ?? null,
        companyName: d.companyName ?? null,
        notes: d.notes ?? null,
      },
    };
  }

  private map(raw: any) {
    return {
      id: raw.id,
      organizationId: raw.organizationId,
      clientId: raw.clientId ?? null,
      name: raw.name,
      code: raw.code,
      description: raw.description ?? null,
      summary: raw.summary,
      type: raw.type,
      methodology: raw.methodology,
      status: raw.status ?? "BACKLOG",
      health: raw.health ?? "GREEN",
      priority: raw.priority ?? "MEDIUM",
      complexity: raw.complexity ?? null,
      riskLevel: raw.riskLevel ?? null,
      startDate: fromFirestoreDate(raw.startDate) ?? new Date(),
      estimatedEndDate: fromFirestoreDate(raw.estimatedEndDate),
      actualEndDate: fromFirestoreDate(raw.actualEndDate),
      estimatedHours: raw.estimatedHours ?? null,
      actualHours: raw.actualHours ?? null,
      contractValue: raw.contractValue ?? null,
      billingModel: raw.billingModel ?? null,
      slaHours: raw.slaHours ?? null,
      estimatedBudget: raw.estimatedBudget ?? null,
      actualCost: raw.actualCost ?? null,
      expectedMargin: raw.expectedMargin ?? null,
      actualMargin: raw.actualMargin ?? null,
      mainStack: raw.mainStack ?? null,
      architecture: raw.architecture ?? null,
      databaseType: raw.databaseType ?? null,
      cloudProvider: raw.cloudProvider ?? null,
      repositoryUrl: raw.repositoryUrl ?? null,
      allowMultipleTeams: raw.allowMultipleTeams ?? false,
      allowMultipleBoards: raw.allowMultipleBoards ?? false,
      financialControl: raw.financialControl ?? false,
      visibility: raw.visibility ?? "PRIVATE",
      createdAt: fromFirestoreDate(raw.createdAt) ?? new Date(),
      updatedAt: fromFirestoreDate(raw.updatedAt) ?? new Date(),
      deletedAt: fromFirestoreDate(raw.deletedAt),
    };
  }

  async create(input: any) {
    const id = randomUUID();
    const now = new Date();
    const doc: ProjectDoc = {
      ...input,
      id,
      clientId: input.clientId ?? null,
      description: input.description ?? null,
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
      allowMultipleTeams: input.allowMultipleTeams ?? false,
      allowMultipleBoards: input.allowMultipleBoards ?? false,
      financialControl: input.financialControl ?? false,
      visibility: input.visibility ?? "PRIVATE",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await this.projects().doc(id).set(doc);
    return this.attachClient(this.map(doc));
  }

  async findById(id: string) {
    const snap = await this.projects().doc(id).get();
    if (!snap.exists) return null;
    const d = snap.data() as any;
    return this.attachClient(this.map({ ...d, id: d.id ?? snap.id }));
  }

  async findByCode(code: string) {
    const snap = await this.projects().where("code", "==", code).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    const d = doc.data() as any;
    return this.attachClient(this.map({ ...d, id: d.id ?? doc.id }));
  }

  async findByOrgAndName(organizationId: string, name: string) {
    const snap = await this.projects().where("organizationId", "==", organizationId).where("name", "==", name).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    const d = doc.data() as any;
    return this.attachClient(this.map({ ...d, id: d.id ?? doc.id }));
  }

  async listByOrganization(organizationId: string) {
    const snap = await this.projects().where("organizationId", "==", organizationId).get();
    const mapped = snap.docs.map(d => this.map({ ...(d.data() as any), id: (d.data() as any)?.id ?? d.id }));
    const withClient = await Promise.all(mapped.map(p => this.attachClient(p)));
    return withClient;
  }
}

