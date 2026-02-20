"use client";

import { useSseSnapshot } from "@/app/ui/useSseSnapshot";
import { useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, defaultDropAnimation, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ApiError, apiFetch } from "@/app/ui/apiClient";
import { ChatModal } from "./ChatModal";

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {COLUMNS.map(col => (
        <section key={col} className="w-[min(360px,calc(100vw-32px))] shrink-0">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2 px-1 pb-3">
              <div className="h-4 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex max-h-[calc(100vh-320px)] flex-col gap-3 overflow-hidden pr-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

type AttendanceStatus = "Agent" | "Waiting" | "InProgress" | "Finished";

type KanbanColumnLabel = "Agente" | "Aguardando atendimento" | "Em atendimento" | "Finalizado";

const COLUMNS: KanbanColumnLabel[] = ["Agente", "Aguardando atendimento", "Em atendimento", "Finalizado"];

function statusToLabel(s: AttendanceStatus): KanbanColumnLabel {
  if (s === "Agent") return "Agente";
  if (s === "Waiting") return "Aguardando atendimento";
  if (s === "InProgress") return "Em atendimento";
  return "Finalizado";
}

function labelToStatus(l: KanbanColumnLabel): AttendanceStatus {
  if (l === "Agente") return "Agent";
  if (l === "Aguardando atendimento") return "Waiting";
  if (l === "Em atendimento") return "InProgress";
  return "Finished";
}

type PatientCard = {
  id: string;
  organizationId: string;
  unitId: string | null;
  name: string;
  phone: string | null;
  attendanceStatus: AttendanceStatus | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

function StatusColumn({
  status,
  count,
  sortableIds,
  children,
}: {
  status: KanbanColumnLabel;
  count: number;
  sortableIds: string[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `status:${status}` });
  return (
    <section ref={setNodeRef} className="w-[min(360px,calc(100vw-32px))] shrink-0">
      <div
        className={[
          "rounded-2xl border bg-card p-3 shadow-sm",
          isOver ? "border-primary ring-2 ring-primary/20" : "border-border",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-2 px-1 pb-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{status}</div>
          </div>
          <div className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{count}</div>
        </div>

        <div className="flex max-h-[calc(100vh-320px)] flex-col gap-3 overflow-y-auto pr-1">
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {children}
          </SortableContext>
        </div>
      </div>
    </section>
  );
}

function PatientCardView({
  patient,
  onOpen,
}: {
  patient: PatientCard;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `patient:${patient.id}`,
    data: { type: "patient", patientId: patient.id },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={[
        "w-full cursor-grab active:cursor-grabbing rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:shadow-md",
        isDragging ? "opacity-40 border-dashed bg-muted/30" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
          {initials(patient.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{patient.name}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{patient.phone ?? "—"}</div>
        </div>
      </div>
    </button>
  );
}

function PatientCardDragPreview({ patient }: { patient: PatientCard }) {
  return (
    <div className="w-[min(360px,calc(100vw-32px))] scale-105 cursor-grabbing rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-primary/20 ring-2 ring-primary/10 transition-shadow">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
          {initials(patient.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{patient.name}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{patient.phone ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}

type Unit = { id: string; name: string };

export default function AttendancesKanbanPage() {
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [unitsList, setUnitsList] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const patientsStreamUrl =
    isOrgAdmin && selectedUnitId
      ? `/api/stream/patients?unitId=${encodeURIComponent(selectedUnitId)}&all=1`
      : "/api/stream/patients?all=1";

  const { connected, data } = useSseSnapshot<{ patients: PatientCard[] }>(patientsStreamUrl);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientCard | null>(null);
  const [activePatient, setActivePatient] = useState<PatientCard | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, AttendanceStatus>>({});

  useEffect(() => {
    const run = async () => {
      try {
        const me = await apiFetch<{ user: { roles: string[] } }>("/api/auth/me");
        setIsOrgAdmin(me.user.roles.includes("ORG_ADMIN"));
      } catch {
        setIsOrgAdmin(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    if (!isOrgAdmin) return;
    apiFetch<{ units: Unit[] }>("/api/units")
      .then(r => setUnitsList(r.units ?? []))
      .catch(() => setUnitsList([]));
  }, [isOrgAdmin]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (!data?.patients) return;
    setOptimisticStatus(prev => {
      const next = { ...prev };
      for (const p of data.patients) {
        if (p?.id && prev[p.id] === p.attendanceStatus) delete next[p.id];
      }
      return next;
    });
  }, [data?.patients]);

  const patientsWithStatus = useMemo(() => {
    const list = Array.isArray(data?.patients) ? data.patients : [];
    const withStatus = list.filter((p): p is PatientCard & { attendanceStatus: AttendanceStatus } =>
      p.attendanceStatus != null && ["Agent", "Waiting", "InProgress", "Finished"].includes(p.attendanceStatus),
    );
    return withStatus.map(p => ({
      ...p,
      attendanceStatus: (optimisticStatus[p.id] ?? p.attendanceStatus) as AttendanceStatus,
    }));
  }, [data?.patients, optimisticStatus]);

  const patientsByColumn = useMemo(() => {
    const map = new Map<KanbanColumnLabel, PatientCard[]>();
    for (const col of COLUMNS) map.set(col, []);
    for (const p of patientsWithStatus) {
      const col = statusToLabel(p.attendanceStatus);
      const list = map.get(col) ?? [];
      list.push(p);
      map.set(col, list);
    }
    return map;
  }, [patientsWithStatus]);

  const sortableIdsByColumn = useMemo(() => {
    const map = new Map<KanbanColumnLabel, string[]>();
    for (const col of COLUMNS) {
      const list = patientsByColumn.get(col) ?? [];
      map.set(col, list.map(p => `patient:${p.id}`));
    }
    return map;
  }, [patientsByColumn]);

  const findStatusByPatientId = (patientId: string) => {
    const p = patientsWithStatus.find(x => x.id === patientId);
    return p ? statusToLabel(p.attendanceStatus) : null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);
    if (!activeId.startsWith("patient:")) {
      setActivePatient(null);
      return;
    }
    const patientId = activeId.slice("patient:".length);
    const patient = patientsWithStatus.find(p => p.id === patientId) ?? null;
    setActivePatient(patient);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActivePatient(null);
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!activeId.startsWith("patient:")) return;
    const patientId = activeId.slice("patient:".length);
    if (!overId) return;

    const overStatus: KanbanColumnLabel | null = overId.startsWith("status:")
      ? (overId.slice("status:".length) as KanbanColumnLabel)
      : overId.startsWith("patient:")
      ? findStatusByPatientId(overId.slice("patient:".length))
      : null;

    if (!overStatus || !COLUMNS.includes(overStatus)) return;

    const fromStatus = findStatusByPatientId(patientId);
    if (!fromStatus || fromStatus === overStatus) return;

    const toAttendanceStatus = labelToStatus(overStatus);
    setError(null);
    setOptimisticStatus(prev => ({ ...prev, [patientId]: toAttendanceStatus }));
    try {
      await apiFetch(`/api/patients/${encodeURIComponent(patientId)}`, {
        method: "PUT",
        json: { attendanceStatus: toAttendanceStatus },
      });
      if (selectedPatient?.id === patientId) {
        setSelectedPatient(prev => (prev ? { ...prev, attendanceStatus: toAttendanceStatus } : null));
      }
    } catch (e) {
      setOptimisticStatus(prev => {
        const next = { ...prev };
        delete next[patientId];
        return next;
      });
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao mover card.");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Atendimentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Arraste e solte os cards entre colunas para alterar o status do atendimento.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isOrgAdmin && unitsList.length > 0 ? (
            <select
              value={selectedUnitId}
              onChange={e => setSelectedUnitId(e.target.value)}
              className="h-9 rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todas as unidades</option>
              {unitsList.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          ) : null}
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{connected ? "Conectado" : "Conectando…"}</div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      {!connected || data === null ? (
        <KanbanSkeleton />
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActivePatient(null)}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {COLUMNS.map(col => {
              const list = patientsByColumn.get(col) ?? [];
              const ids = sortableIdsByColumn.get(col) ?? [];
              return (
                <StatusColumn key={col} status={col} count={list.length} sortableIds={ids}>
                  {list.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-muted/50 px-4 py-4 text-sm text-muted-foreground">Nenhum contato</div>
                  ) : (
                    list.map(p => (
                      <PatientCardView
                        key={p.id}
                        patient={p}
                        onOpen={() => setSelectedPatient(p)}
                      />
                    ))
                  )}
                </StatusColumn>
              );
            })}
          </div>
          <DragOverlay dropAnimation={defaultDropAnimation}>
            {activePatient ? <PatientCardDragPreview patient={activePatient} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {selectedPatient ? (
        <ChatModal
          patient={{
            id: selectedPatient.id,
            name: selectedPatient.name,
            phone: selectedPatient.phone,
            attendanceStatus: selectedPatient.attendanceStatus,
          }}
          onClose={() => setSelectedPatient(null)}
        />
      ) : null}
    </div>
  );
}
