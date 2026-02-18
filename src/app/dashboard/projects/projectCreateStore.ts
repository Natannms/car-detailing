"use client";

import { create } from "zustand";

export type ProjectDraft = {
  name: string;
  code: string;
  clientId: string | null;
  type: "SAAS" | "CLIENT" | "INTERNAL" | "MVP" | "POC";
  methodology: "SCRUM" | "KANBAN" | "HYBRID" | "WATERFALL";
  summary: string;

  descriptionDetailed: string;
  problem: string;
  targetAudience: string;
  objectives: string;
  successCriteria: string;
  kpis: string;
  slaHours: string;
  contractValue: string;
  billingModel: "" | "FIXED" | "HOURLY" | "MONTHLY";

  mainStack: string;
  databaseType: string;
  architecture: "" | "MONOLITH" | "MICROSERVICES" | "EVENT_DRIVEN";
  repositoryUrl: string;
  cloudProvider: string;
  externalIntegrations: string;
  deployEnvironment: string;

  startDate: string;
  estimatedEndDate: string;
  actualEndDate: string;
  estimatedHours: string;
  actualHours: string;
  priority: "" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  complexity: "" | "1" | "2" | "3" | "4" | "5";
  riskLevel: "" | "LOW" | "MEDIUM" | "HIGH";

  status: "" | "BACKLOG" | "PLANNING" | "EXECUTION" | "HOMOLOGATION" | "PRODUCTION" | "FINISHED" | "CANCELED";
  health: "" | "GREEN" | "YELLOW" | "RED";
  estimatedBudget: string;
  actualCost: string;
  expectedMargin: string;
  actualMargin: string;

  allowMultipleTeams: boolean;
  allowMultipleBoards: boolean;
  financialControl: boolean;
  visibility: "" | "PRIVATE" | "ORGANIZATION" | "PUBLIC";
};

export type ProjectCreateState = {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  draft: ProjectDraft;
  setStep: (step: ProjectCreateState["step"]) => void;
  next: () => void;
  back: () => void;
  setDraft: (patch: Partial<ProjectDraft>) => void;
  reset: () => void;
};

const initialDraft: ProjectDraft = {
  name: "",
  code: "",
  clientId: null,
  type: "SAAS",
  methodology: "KANBAN",
  summary: "",

  descriptionDetailed: "",
  problem: "",
  targetAudience: "",
  objectives: "",
  successCriteria: "",
  kpis: "",
  slaHours: "",
  contractValue: "",
  billingModel: "",

  mainStack: "",
  databaseType: "",
  architecture: "",
  repositoryUrl: "",
  cloudProvider: "",
  externalIntegrations: "",
  deployEnvironment: "",

  startDate: "",
  estimatedEndDate: "",
  actualEndDate: "",
  estimatedHours: "",
  actualHours: "",
  priority: "",
  complexity: "",
  riskLevel: "",

  status: "",
  health: "",
  estimatedBudget: "",
  actualCost: "",
  expectedMargin: "",
  actualMargin: "",

  allowMultipleTeams: false,
  allowMultipleBoards: false,
  financialControl: false,
  visibility: "",
};

export const useProjectCreateStore = create<ProjectCreateState>(set => ({
  step: 1,
  draft: initialDraft,
  setStep: step => set({ step }),
  next: () => set(s => ({ step: (Math.min(6, s.step + 1) as ProjectCreateState["step"]) })),
  back: () => set(s => ({ step: (Math.max(1, s.step - 1) as ProjectCreateState["step"]) })),
  setDraft: patch => set(s => ({ draft: { ...s.draft, ...patch } })),
  reset: () => set({ step: 1, draft: initialDraft }),
}));

