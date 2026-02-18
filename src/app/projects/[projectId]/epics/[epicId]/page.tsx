"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../../../../ui/apiClient";

type Epic = {
  id: string;
  projectId: string;
  title: string;
  context: string | null;
  expected: string | null;
  status: string;
};

type Story = {
  id: string;
  epicId: string;
  title: string;
  userStory: string;
  acceptanceCriteria: string;
  status: string;
  points: number | null;
};

export default function EpicDetailPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string; epicId: string }>();
  const projectId = params.projectId;
  const epicId = params.epicId;

  const [epic, setEpic] = useState<Epic | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editContext, setEditContext] = useState("");
  const [editExpected, setEditExpected] = useState("");
  const [savingEpic, setSavingEpic] = useState(false);
  const [deletingEpic, setDeletingEpic] = useState(false);

  const [storyTitle, setStoryTitle] = useState("");
  const [storyUserStory, setStoryUserStory] = useState("");
  const [storyCriteria, setStoryCriteria] = useState("");
  const [storyPoints, setStoryPoints] = useState<string>("");
  const [creatingStory, setCreatingStory] = useState(false);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const epicRes = await apiFetch<{ epic: Epic }>(`/api/epics/${encodeURIComponent(epicId)}`);
      const storiesRes = await apiFetch<{ stories: Story[] }>(`/api/stories?epicId=${encodeURIComponent(epicId)}`);
      setEpic(epicRes.epic);
      setStories(storiesRes.stories);
      setEditTitle(epicRes.epic.title);
      setEditStatus(epicRes.epic.status);
      setEditContext(epicRes.epic.context ?? "");
      setEditExpected(epicRes.epic.expected ?? "");
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao carregar épico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [epicId]);

  const saveEpic = async () => {
    setError(null);
    if (!epic) return;
    const title = editTitle.trim();
    if (!title) {
      setError("Título do épico é obrigatório.");
      return;
    }
    setSavingEpic(true);
    try {
      const res = await apiFetch<{ epic: Epic }>(`/api/epics/${encodeURIComponent(epicId)}`, {
        method: "PUT",
        json: {
          title,
          status: editStatus.trim() || "TODO",
          context: editContext.trim() ? editContext : null,
          expected: editExpected.trim() ? editExpected : null,
        },
      });
      setEpic(res.epic);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao salvar épico.");
    } finally {
      setSavingEpic(false);
    }
  };

  const deleteEpic = async () => {
    if (!confirm("Excluir este épico?")) return;
    setError(null);
    setDeletingEpic(true);
    try {
      await apiFetch<{ ok: true }>(`/api/epics/${encodeURIComponent(epicId)}`, { method: "DELETE" });
      router.push(`/projects/${projectId}/backlog`);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao excluir épico.");
    } finally {
      setDeletingEpic(false);
    }
  };

  const createStory = async () => {
    setError(null);
    const title = storyTitle.trim();
    if (!title) {
      setError("Título da story é obrigatório.");
      return;
    }
    if (!storyUserStory.trim() || !storyCriteria.trim()) {
      setError("Preencha User Story e Critérios de aceite.");
      return;
    }
    const points = storyPoints.trim() ? Number(storyPoints) : null;
    if (storyPoints.trim() && (!Number.isFinite(points) || points! < 0)) {
      setError("Points deve ser um número >= 0.");
      return;
    }

    setCreatingStory(true);
    try {
      const res = await apiFetch<{ story: Story }>("/api/stories", {
        method: "POST",
        json: {
          epicId,
          title,
          userStory: storyUserStory,
          acceptanceCriteria: storyCriteria,
          points,
        },
      });
      setStoryTitle("");
      setStoryUserStory("");
      setStoryCriteria("");
      setStoryPoints("");
      setStories(prev => [...prev, res.story]);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao criar story.");
    } finally {
      setCreatingStory(false);
    }
  };

  if (loading) return <div>Carregando épico…</div>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h1>Épico</h1>
        <Link href={`/projects/${projectId}/backlog`} style={{ padding: "6px 10px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8 }}>
          Voltar ao Backlog
        </Link>
      </div>

      {error ? <div style={{ color: "rgb(200,0,0)" }}>{error}</div> : null}

      {epic ? (
        <section style={{ display: "grid", gap: 8, padding: 12, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
          <h2 style={{ fontSize: 16 }}>Detalhes</h2>
          <label style={{ display: "grid", gap: 4 }}>
            <span>Título</span>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span>Status</span>
            <input value={editStatus} onChange={e => setEditStatus(e.target.value)} placeholder="TODO" />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span>Contexto</span>
            <textarea value={editContext} onChange={e => setEditContext(e.target.value)} rows={3} />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span>Resultado esperado</span>
            <textarea value={editExpected} onChange={e => setEditExpected(e.target.value)} rows={3} />
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={saveEpic} disabled={savingEpic}>
              {savingEpic ? "Salvando…" : "Salvar"}
            </button>
            <button type="button" onClick={deleteEpic} disabled={deletingEpic} style={{ color: "rgb(200,0,0)" }}>
              {deletingEpic ? "Excluindo…" : "Excluir"}
            </button>
          </div>
        </section>
      ) : null}

      <section style={{ display: "grid", gap: 8, padding: 12, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
        <h2 style={{ fontSize: 16 }}>Criar Story</h2>
        <input value={storyTitle} onChange={e => setStoryTitle(e.target.value)} placeholder="Título" />
        <textarea value={storyUserStory} onChange={e => setStoryUserStory(e.target.value)} rows={3} placeholder="Eu como… Quero… Para…" />
        <textarea value={storyCriteria} onChange={e => setStoryCriteria(e.target.value)} rows={4} placeholder="Dado que… Quando… Então…" />
        <input value={storyPoints} onChange={e => setStoryPoints(e.target.value)} placeholder="Points (opcional)" />
        <button type="button" onClick={createStory} disabled={creatingStory}>
          {creatingStory ? "Criando…" : "Criar"}
        </button>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ fontSize: 16 }}>Stories</h2>
        {stories.length === 0 ? <div>Nenhuma story ainda.</div> : null}
        <ul style={{ display: "grid", gap: 8, listStyle: "none" }}>
          {stories.map(s => (
            <li key={s.id} style={{ padding: 12, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong>{s.title}</strong>
                  <span style={{ opacity: 0.7, fontSize: 12 }}>
                    {s.status}
                    {s.points != null ? ` • ${s.points} pts` : ""}
                  </span>
                </div>
                <Link
                  href={`/projects/${projectId}/stories/${s.id}`}
                  style={{ padding: "6px 10px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8 }}
                >
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

