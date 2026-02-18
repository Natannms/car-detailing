"use client";

export type Session = {
  lastProjectId: string | null;
};

const LAST_PROJECT_KEY = "kanban_ai_last_project";

export function getSession(): Session {
  if (typeof window === "undefined") return { lastProjectId: null };
  return {
    lastProjectId: window.localStorage.getItem(LAST_PROJECT_KEY),
  };
}

export function clearSession() {
  window.localStorage.removeItem(LAST_PROJECT_KEY);
}

export function setLastProjectId(projectId: string) {
  window.localStorage.setItem(LAST_PROJECT_KEY, projectId);
}
