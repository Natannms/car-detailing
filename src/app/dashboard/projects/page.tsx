"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "../../ui/apiClient";
import { Button } from "@/components/ui/button";
import { MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { ProjectCreateForm } from "./ProjectCreateForm";
import { useProjectCreateStore } from "./projectCreateStore";

type Project = {
  id: string;
  organizationId: string;
  name: string;
  code?: string | null;
  status?: string | null;
  health?: string | null;
  methodology?: string | null;
  startDate?: string | null;
  client?: { id: string; name: string } | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Fechar modal" />
      <div className="absolute left-1/2 top-1/2 w-[min(900px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.25)] ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-900">{title}</div>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
          <div className="max-h-[calc(100vh-180px)] overflow-auto px-5 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(p => `${p.name} ${p.code ?? ""} ${p.client?.name ?? ""}`.toLowerCase().includes(q));
  }, [projects, query]);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ projects: Project[] }>("/api/projects");
      setProjects(data.projects);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao carregar projetos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setSelected(null);
    apiFetch<{ project: Project }>(`/api/projects/${encodeURIComponent(selectedId)}`)
      .then(r => setSelected(r.project))
      .catch(() => setSelected(null));
  }, [selectedId]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-600">Gerencie seus projetos, veja detalhes e crie novos registros.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
            onClick={() => setCreateOpen(true)}
          >
            <Plus weight="bold" />
            Cadastrar projeto
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-lg">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <MagnifyingGlass size={18} weight="bold" />
            </div>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nome, código ou cliente…"
              className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Atualizar
          </button>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Projeto</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">Metodologia</th>
                <th className="px-4 py-3">Início</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={7}>
                    Carregando projetos…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={7}>
                    Nenhum projeto encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr
                    key={p.id}
                    className="cursor-pointer bg-white transition hover:bg-gray-50"
                    onClick={() => {
                      setSelectedId(p.id);
                      setDetailsOpen(true);
                    }}
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      <div className="mt-1 text-xs text-gray-500">{p.id}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{p.code ?? "—"}</td>
                    <td className="px-4 py-4 text-gray-700">{p.client?.name ?? "—"}</td>
                    <td className="px-4 py-4 text-gray-700">{p.status ?? "—"}</td>
                    <td className="px-4 py-4 text-gray-700">{p.health ?? "—"}</td>
                    <td className="px-4 py-4 text-gray-700">{p.methodology ?? "—"}</td>
                    <td className="px-4 py-4 text-gray-700">{formatDate(p.startDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={detailsOpen}
        title={selected ? selected.name : "Detalhes do projeto"}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedId(null);
          setSelected(null);
        }}
      >
        {!selected ? (
          <div className="text-sm text-gray-600">Carregando…</div>
        ) : (
          <div className="grid gap-6">
            <div className="grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Informações</div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="grid gap-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Nome</span>
                    <span className="font-semibold text-gray-900">{selected.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Código</span>
                    <span className="font-semibold text-gray-900">{selected.code ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Cliente</span>
                    <span className="font-semibold text-gray-900">{selected.client?.name ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Status</span>
                    <span className="font-semibold text-gray-900">{selected.status ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Health</span>
                    <span className="font-semibold text-gray-900">{selected.health ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Metodologia</span>
                    <span className="font-semibold text-gray-900">{selected.methodology ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Data início</span>
                    <span className="font-semibold text-gray-900">{formatDate(selected.startDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Os campos completos do projeto (escopo, técnicos, financeiro, etc.) serão exibidos aqui assim que o modelo Prisma robusto estiver aplicado.
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={createOpen}
        title="Cadastrar projeto"
        onClose={() => {
          useProjectCreateStore.getState().reset();
          setCreateOpen(false);
        }}
      >
        <ProjectCreateForm
          onCancel={() => {
            useProjectCreateStore.getState().reset();
            setCreateOpen(false);
          }}
          onCreated={() => {
            setCreateOpen(false);
            void load();
          }}
        />
      </Modal>
    </div>
  );
}
