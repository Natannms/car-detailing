"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, ApiError } from "../../../ui/apiClient";
import { setLastProjectId } from "../../../ui/session";

type Epic = {
  id: string;
  projectId: string;
  title: string;
  context: string | null;
  expected: string | null;
  status: string;
};

export default function ProjectBacklogPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [epics, setEpics] = useState<Epic[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ epics: Epic[] }>(`/api/epics?projectId=${encodeURIComponent(projectId)}`);
      setEpics(data.epics);
      setLastProjectId(projectId);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao carregar épicos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [projectId]);

  const create = async () => {
    setError(null);
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Informe o título do épico.");
      return;
    }
    setCreating(true);
    try {
      const data = await apiFetch<{ epic: Epic }>("/api/epics", {
        method: "POST",
        json: { projectId, title: trimmed },
      });
      setTitle("");
      setEpics(prev => [...prev, data.epic]);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao criar épico.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div>Carregando backlog…</div>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <h1>Backlog</h1>
        <Link href={`/projects/${projectId}/import`} style={{ padding: "6px 10px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8 }}>
          Importar Markdown
        </Link>
      </div>

      {error ? <div style={{ color: "rgb(200,0,0)" }}>{error}</div> : null}

      <section style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <h2 style={{ fontSize: 16 }}>Criar épico</h2>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do épico" />
        <button type="button" onClick={create} disabled={creating}>
          {creating ? "Criando…" : "Criar"}
        </button>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ fontSize: 16 }}>Épicos</h2>
        {epics.length === 0 ? <div>Nenhum épico ainda.</div> : null}
        <ul style={{ display: "grid", gap: 8, listStyle: "none" }}>
          {epics.map(e => (
            <li key={e.id} style={{ padding: 12, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong>{e.title}</strong>
                  <span style={{ opacity: 0.7, fontSize: 12 }}>{e.status}</span>
                </div>
                <Link href={`/projects/${projectId}/epics/${e.id}`} style={{ padding: "6px 10px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8 }}>
                  Abrir
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

