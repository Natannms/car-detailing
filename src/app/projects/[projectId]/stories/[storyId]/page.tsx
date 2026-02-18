"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../../../../ui/apiClient";
import { TaskKanban } from "@/components/kanban/TaskKanban";

type Story = {
  id: string;
  epicId: string;
  title: string;
  userStory: string;
  acceptanceCriteria: string;
  status: string;
  points: number | null;
};

type Task = {
  id: string;
  storyId: string;
  title: string;
  description: string | null;
  status: string;
};

export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string; storyId: string }>();
  const projectId = params.projectId;
  const storyId = params.storyId;

  const [story, setStory] = useState<Story | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editUserStory, setEditUserStory] = useState("");
  const [editCriteria, setEditCriteria] = useState("");
  const [editPoints, setEditPoints] = useState<string>("");
  const [savingStory, setSavingStory] = useState(false);
  const [deletingStory, setDeletingStory] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const storyRes = await apiFetch<{ story: Story }>(`/api/stories/${encodeURIComponent(storyId)}`);
      const tasksRes = await apiFetch<{ tasks: Task[] }>(`/api/tasks?storyId=${encodeURIComponent(storyId)}`);
      setStory(storyRes.story);
      setTasks(tasksRes.tasks);
      setEditTitle(storyRes.story.title);
      setEditStatus(storyRes.story.status);
      setEditUserStory(storyRes.story.userStory);
      setEditCriteria(storyRes.story.acceptanceCriteria);
      setEditPoints(storyRes.story.points != null ? String(storyRes.story.points) : "");
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao carregar story.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [storyId]);

  const saveStory = async () => {
    setError(null);
    if (!story) return;
    const title = editTitle.trim();
    if (!title) {
      setError("Título é obrigatório.");
      return;
    }
    if (!editUserStory.trim() || !editCriteria.trim()) {
      setError("Preencha User Story e Critérios de aceite.");
      return;
    }
    const points = editPoints.trim() ? Number(editPoints) : null;
    if (editPoints.trim() && (!Number.isFinite(points) || points! < 0)) {
      setError("Points deve ser um número >= 0.");
      return;
    }

    setSavingStory(true);
    try {
      const res = await apiFetch<{ story: Story }>(`/api/stories/${encodeURIComponent(storyId)}`, {
        method: "PUT",
        json: {
          title,
          status: editStatus.trim() || "TODO",
          userStory: editUserStory,
          acceptanceCriteria: editCriteria,
          points,
        },
      });
      setStory(res.story);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao salvar story.");
    } finally {
      setSavingStory(false);
    }
  };

  const deleteStory = async () => {
    if (!confirm("Excluir esta story?")) return;
    setError(null);
    setDeletingStory(true);
    try {
      await apiFetch<{ ok: true }>(`/api/stories/${encodeURIComponent(storyId)}`, { method: "DELETE" });
      router.push(`/projects/${projectId}/backlog`);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao excluir story.");
    } finally {
      setDeletingStory(false);
    }
  };

  const createTask = async () => {
    setError(null);
    const title = taskTitle.trim();
    if (!title) {
      setError("Título da task é obrigatório.");
      return;
    }
    setCreatingTask(true);
    try {
      const res = await apiFetch<{ task: Task }>("/api/tasks", {
        method: "POST",
        json: {
          storyId,
          title,
          description: taskDescription.trim() ? taskDescription : null,
        },
      });
      setTaskTitle("");
      setTaskDescription("");
      setTasks(prev => [...prev, res.task]);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao criar task.");
    } finally {
      setCreatingTask(false);
    }
  };

  const updateTask = async (taskId: string, patch: Partial<Pick<Task, "title" | "description" | "status">>) => {
    setError(null);
    try {
      const res = await apiFetch<{ task: Task }>(`/api/tasks/${encodeURIComponent(taskId)}`, {
        method: "PUT",
        json: patch,
      });
      setTasks(prev => prev.map(t => (t.id === taskId ? res.task : t)));
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao atualizar task.");
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Excluir esta task?")) return;
    setError(null);
    try {
      await apiFetch<{ ok: true }>(`/api/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao excluir task.");
    }
  };

  const reloadTasks = async () => {
    try {
      const tasksRes = await apiFetch<{ tasks: Task[] }>(`/api/tasks?storyId=${encodeURIComponent(storyId)}`);
      setTasks(tasksRes.tasks);
    } catch {
      setTasks([]);
    }
  };

  if (loading) return <div>Carregando story…</div>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h1>Story</h1>
        <Link href={`/projects/${projectId}/backlog`} style={{ padding: "6px 10px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8 }}>
          Voltar ao Backlog
        </Link>
      </div>

      {error ? <div style={{ color: "rgb(200,0,0)" }}>{error}</div> : null}

      {story ? (
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
            <span>User Story</span>
            <textarea value={editUserStory} onChange={e => setEditUserStory(e.target.value)} rows={3} />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span>Critérios de Aceite</span>
            <textarea value={editCriteria} onChange={e => setEditCriteria(e.target.value)} rows={5} />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span>Points (opcional)</span>
            <input value={editPoints} onChange={e => setEditPoints(e.target.value)} />
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={saveStory} disabled={savingStory}>
              {savingStory ? "Salvando…" : "Salvar"}
            </button>
            <button type="button" onClick={deleteStory} disabled={deletingStory} style={{ color: "rgb(200,0,0)" }}>
              {deletingStory ? "Excluindo…" : "Excluir"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Criar Task</h2>
        <input
          value={taskTitle}
          onChange={e => setTaskTitle(e.target.value)}
          placeholder="Título"
          className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        <textarea
          value={taskDescription}
          onChange={e => setTaskDescription(e.target.value)}
          rows={3}
          placeholder="Descrição (opcional)"
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          type="button"
          onClick={createTask}
          disabled={creatingTask}
          className="h-11 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
        >
          {creatingTask ? "Criando…" : "Criar"}
        </button>
      </section>

      <section className="grid gap-3">
        <TaskKanban storyId={storyId} tasks={tasks} setTasks={setTasks} updateTask={updateTask} reload={reloadTasks} />
        <div className="text-xs text-gray-500">
          Dica: para excluir uma task, use o menu na própria task (em breve) ou remova pelo endpoint atual.
        </div>
      </section>
    </div>
  );
}
