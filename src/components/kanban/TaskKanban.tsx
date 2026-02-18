"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { apiFetch, ApiError } from "@/app/ui/apiClient";
import { DotsThree, Plus, Trash, PencilSimple, X } from "@phosphor-icons/react";

type Column = { id: string; storyId: string; name: string; order: number };

export type KanbanTask = {
  id: string;
  storyId: string;
  title: string;
  description: string | null;
  status: string;
};

function clampText(text: string, max = 120) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function Card({
  task,
  columnName,
}: {
  task: KanbanTask;
  columnName: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task:${task.id}`,
    data: { type: "task", taskId: task.id, fromStatus: columnName },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        "rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_10px_25px_rgba(15,23,42,0.08)]",
        "transition hover:shadow-[0_14px_34px_rgba(15,23,42,0.12)]",
        isDragging ? "opacity-70" : "",
      ].join(" ")}
    >
      <div className="text-sm font-semibold text-gray-900">{task.title}</div>
      {task.description ? <div className="mt-1 text-xs text-gray-600">{clampText(task.description, 140)}</div> : null}
    </div>
  );
}

function ColumnView({
  column,
  tasks,
  sortableIds,
  onToggleMenu,
  renaming,
  renameValue,
  setRenameValue,
  onSubmitRename,
  onCancelRename,
}: {
  column: Column;
  tasks: KanbanTask[];
  sortableIds: string[];
  onToggleMenu: () => void;
  renaming: boolean;
  renameValue: string;
  setRenameValue: (v: string) => void;
  onSubmitRename: () => void;
  onCancelRename: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${column.id}` });

  return (
    <div
      ref={setNodeRef}
      className={[
        "w-[min(340px,calc(100vw-32px))] shrink-0 rounded-2xl border bg-white/60 p-3",
        isOver ? "border-indigo-300" : "border-gray-200",
      ].join(" ")}
    >
      <div className="relative flex items-center justify-between gap-2 pb-3" data-kanban-menu>
        <div className="min-w-0">
          {renaming ? (
            <div className="flex items-center gap-2">
              <input
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                className="h-9 w-44 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700"
                onClick={onSubmitRename}
              >
                Salvar
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                onClick={onCancelRename}
                aria-label="Cancelar"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="truncate text-sm font-semibold text-gray-900">{column.name}</div>
              <div className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{tasks.length}</div>
            </div>
          )}
        </div>

        {!renaming ? (
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-white hover:text-gray-700"
            onClick={onToggleMenu}
            aria-label="Menu"
          >
            <DotsThree size={18} weight="bold" />
          </button>
        ) : null}
      </div>

      <div className="flex max-h-[calc(100vh-320px)] flex-col gap-3 overflow-y-auto pr-1">
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {tasks.map(t => (
            <Card key={t.id} task={t} columnName={column.name} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function TaskKanban({
  storyId,
  tasks,
  setTasks,
  updateTask,
  reload,
}: {
  storyId: string;
  tasks: KanbanTask[];
  setTasks: React.Dispatch<React.SetStateAction<KanbanTask[]>>;
  updateTask: (taskId: string, patch: Partial<Pick<KanbanTask, "title" | "description" | "status">>) => Promise<void>;
  reload: () => Promise<void>;
}) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [columnsLoading, setColumnsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newColumnOpen, setNewColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const loadColumns = async () => {
    setError(null);
    setColumnsLoading(true);
    try {
      const data = await apiFetch<{ columns: Column[] }>(`/api/task-board-columns?storyId=${encodeURIComponent(storyId)}`);
      setColumns(data.columns);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao carregar colunas.");
      setColumns([]);
    } finally {
      setColumnsLoading(false);
    }
  };

  useEffect(() => {
    void loadColumns();
  }, [storyId]);

  const orderedColumns = useMemo(() => [...columns].sort((a, b) => a.order - b.order), [columns]);

  const tasksByStatus = useMemo(() => {
    const map = new Map<string, KanbanTask[]>();
    for (const c of orderedColumns) map.set(c.name, []);
    for (const t of tasks) {
      const list = map.get(t.status);
      if (list) list.push(t);
    }
    return map;
  }, [orderedColumns, tasks]);

  const columnTaskIds = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of orderedColumns) {
      const list = tasksByStatus.get(c.name) ?? [];
      map.set(c.id, list.map(t => `task:${t.id}`));
    }
    return map;
  }, [orderedColumns, tasksByStatus]);

  const createColumn = async () => {
    setError(null);
    const name = newColumnName.trim();
    if (!name) return;
    try {
      await apiFetch("/api/task-board-columns", { method: "POST", json: { storyId, name } });
      setNewColumnName("");
      setNewColumnOpen(false);
      await loadColumns();
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao criar coluna.");
    }
  };

  const startRename = (c: Column) => {
    setRenamingId(c.id);
    setRenameValue(c.name);
  };

  const submitRename = async () => {
    if (!renamingId) return;
    setError(null);
    const name = renameValue.trim();
    if (!name) return;
    const current = columns.find(c => c.id === renamingId) ?? null;
    try {
      await apiFetch(`/api/task-board-columns/${encodeURIComponent(renamingId)}`, { method: "PUT", json: { name } });
      if (current && current.name !== name) {
        setTasks(prev => prev.map(t => (t.status === current.name ? { ...t, status: name } : t)));
      }
      setRenamingId(null);
      setRenameValue("");
      await loadColumns();
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao renomear coluna.");
    }
  };

  const deleteColumn = async (columnId: string) => {
    setError(null);
    try {
      await apiFetch(`/api/task-board-columns/${encodeURIComponent(columnId)}`, { method: "DELETE" });
      await reload();
      await loadColumns();
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao excluir coluna.");
    }
  };

  const findColumnByTaskId = (taskId: string) => tasks.find(t => t.id === taskId)?.status ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (!id.startsWith("task:")) return;
    setActiveTaskId(id.slice("task:".length));
  };

  const handleDragOver = (_event: DragOverEvent) => {};

  const handleDragEnd = async (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    setActiveTaskId(null);

    if (!activeId.startsWith("task:")) return;
    const taskId = activeId.slice("task:".length);
    if (!overId) return;

    const overColumnId = overId.startsWith("column:") ? overId.slice("column:".length) : null;
    const overTaskId = overId.startsWith("task:") ? overId.slice("task:".length) : null;

    const fromStatus = findColumnByTaskId(taskId);
    if (!fromStatus) return;

    let toStatus: string | null = null;
    if (overColumnId) {
      const col = columns.find(c => c.id === overColumnId) ?? null;
      toStatus = col?.name ?? null;
    } else if (overTaskId) {
      const overStatus = findColumnByTaskId(overTaskId);
      toStatus = overStatus ?? null;
    }
    if (!toStatus) return;

    if (toStatus !== fromStatus) {
      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: toStatus! } : t)));
      await updateTask(taskId, { status: toStatus });
      return;
    }

    const col = columns.find(c => c.name === fromStatus) ?? null;
    if (!col) return;
    const ids = columnTaskIds.get(col.id) ?? [];
    const oldIndex = ids.indexOf(`task:${taskId}`);
    const newIndex = overTaskId ? ids.indexOf(`task:${overTaskId}`) : oldIndex;
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const ordered = arrayMove(ids, oldIndex, newIndex).map(x => x.slice("task:".length));
    setTasks(prev => {
      const inColumn = prev.filter(t => t.status === fromStatus);
      const other = prev.filter(t => t.status !== fromStatus);
      const map = new Map(inColumn.map(t => [t.id, t] as const));
      const rebuilt = ordered.map(id => map.get(id)).filter(Boolean) as KanbanTask[];
      return [...other, ...rebuilt];
    });
  };

  const closeMenuOnOutside = useRef<(e: MouseEvent) => void>(() => {});

  useEffect(() => {
    closeMenuOnOutside.current = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-kanban-menu]")) return;
      setMenuOpenId(null);
    };
  }, []);

  useEffect(() => {
    if (!menuOpenId) return;
    const handler = (e: MouseEvent) => closeMenuOnOutside.current(e);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [menuOpenId]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Kanban</h2>
          <div className="text-sm text-gray-600">Arraste cards entre colunas para mudar o status.</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNewColumnOpen(v => !v)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-black/5 hover:bg-gray-50"
          >
            <Plus size={18} weight="bold" />
            Nova coluna
          </button>
        </div>
      </div>

      {newColumnOpen ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
          <input
            value={newColumnName}
            onChange={e => setNewColumnName(e.target.value)}
            placeholder="Nome da coluna"
            className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setNewColumnName("");
                setNewColumnOpen(false);
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              onClick={() => void createColumn()}
            >
              Criar
            </button>
          </div>
        </div>
      ) : null}

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {columnsLoading ? <div className="text-sm text-gray-600">Carregando colunas…</div> : null}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {orderedColumns.map(c => {
            const list = tasksByStatus.get(c.name) ?? [];
            const sortableIds = columnTaskIds.get(c.id) ?? [];
            const isRenaming = renamingId === c.id;

            return (
              <div key={c.id} data-kanban-menu className="relative">
                <ColumnView
                  column={c}
                  tasks={list}
                  sortableIds={sortableIds}
                  onToggleMenu={() => setMenuOpenId(prev => (prev === c.id ? null : c.id))}
                  renaming={isRenaming}
                  renameValue={renameValue}
                  setRenameValue={setRenameValue}
                  onSubmitRename={() => void submitRename()}
                  onCancelRename={() => {
                    setRenamingId(null);
                    setRenameValue("");
                  }}
                />
                {menuOpenId === c.id ? (
                  <div className="absolute right-0 top-[46px] z-30 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        setMenuOpenId(null);
                        startRename(c);
                      }}
                    >
                      <PencilSimple size={16} weight="bold" />
                      Renomear
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setMenuOpenId(null);
                        void deleteColumn(c.id);
                      }}
                    >
                      <Trash size={16} weight="bold" />
                      Excluir
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </DndContext>

      {activeTaskId ? null : null}
    </div>
  );
}
