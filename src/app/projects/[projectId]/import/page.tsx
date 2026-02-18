"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { apiFetch, ApiError } from "../../../ui/apiClient";
import { setLastProjectId } from "../../../ui/session";

type ImportReport = {
  epicsCreated: number;
  epicsIgnored: number;
  storiesCreated: number;
  storiesIgnored: number;
  tasksCreated: number;
  tasksIgnored: number;
};

export default function ImportPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [markdown, setMarkdown] = useState("");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runImport = async () => {
    setError(null);
    setReport(null);
    const md = markdown.trim();
    if (!md) {
      setError("Cole um Markdown para importar.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ report: ImportReport }>("/api/backlog-parser/import", {
        method: "POST",
        json: { projectId, markdown: md },
      });
      setLastProjectId(projectId);
      setReport(res.report);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao importar backlog.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h1>Importar Backlog</h1>
        <Link href={`/projects/${projectId}/backlog`} style={{ padding: "6px 10px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8 }}>
          Voltar ao Backlog
        </Link>
      </div>

      {error ? <div style={{ color: "rgb(200,0,0)" }}>{error}</div> : null}

      <section style={{ display: "grid", gap: 8 }}>
        <textarea value={markdown} onChange={e => setMarkdown(e.target.value)} rows={14} placeholder="## Epic\n### Story\n#### Task" />
        <button type="button" onClick={runImport} disabled={loading}>
          {loading ? "Importando…" : "Importar"}
        </button>
      </section>

      {report ? (
        <section style={{ display: "grid", gap: 8, padding: 12, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
          <h2 style={{ fontSize: 16 }}>Relatório</h2>
          <ul style={{ listStyle: "none", display: "grid", gap: 6 }}>
            <li>Epics: {report.epicsCreated} criados / {report.epicsIgnored} ignorados</li>
            <li>Stories: {report.storiesCreated} criados / {report.storiesIgnored} ignorados</li>
            <li>Tasks: {report.tasksCreated} criados / {report.tasksIgnored} ignorados</li>
          </ul>
          <Link href={`/projects/${projectId}/backlog`} style={{ padding: "6px 10px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, width: "fit-content" }}>
            Ver Backlog
          </Link>
        </section>
      ) : null}
    </div>
  );
}

