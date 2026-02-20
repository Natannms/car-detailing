"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/app/ui/apiClient";
import { useSseSnapshot } from "@/app/ui/useSseSnapshot";
import { Button } from "@/components/ui/button";
import { ClipboardText, PencilSimple, Trash, X } from "@phosphor-icons/react";

type Gender = "MASCULINO" | "FEMININO" | "OUTRO";

type Doctor = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  gender: Gender | null;
  specialty: string | null;
};

type Unit = { id: string; name: string };

const specialties = [
  "Cardiologia",
  "Dermatologia",
  "Neurologia",
  "Psiquiatria",
  "Pediatria",
  "Ginecologia e Obstetrícia",
  "Ortopedia e Traumatologia",
  "Oftalmologia",
  "Otorrinolaringologia",
  "Endocrinologia e Metabologia",
  "Gastroenterologia",
  "Pneumologia",
  "Urologia",
  "Reumatologia",
  "Nefrologia",
  "Infectologia",
  "Hematologia e Hemoterapia",
  "Oncologia Clínica",
  "Radiologia e Diagnóstico por Imagem",
  "Medicina de Família e Comunidade",
];

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
      <div className="absolute left-1/2 top-1/2 w-[min(860px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-2xl bg-card shadow-[0_20px_60px_rgba(15,23,42,0.25)] ring-1 ring-border">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <div className="truncate text-sm font-semibold text-foreground">{title}</div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
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

export default function DoctorsPage() {
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unitsList, setUnitsList] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const doctorsStreamUrl =
    isAdmin && selectedUnitId
      ? `/api/stream/doctors?unitId=${encodeURIComponent(selectedUnitId)}`
      : "/api/stream/doctors";

  const { data, error: streamError, connected } = useSseSnapshot<{ doctors: Doctor[] }>(doctorsStreamUrl);
  const doctors = data?.doctors ?? [];
  const loading = !connected && !streamError;

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [editing, setEditing] = useState<Doctor | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"" | Gender>("");
  const [specialty, setSpecialty] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const me = await apiFetch<{ user: { roles: string[] } }>("/api/auth/me");
        setIsAdmin(me.user.roles.includes("ORG_ADMIN"));
      } catch {
        setIsAdmin(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    apiFetch<{ units: Unit[] }>("/api/units")
      .then(r => setUnitsList(r.units ?? []))
      .catch(() => setUnitsList([]));
  }, [isAdmin]);

  const openEdit = (d: Doctor) => {
    if (!isAdmin) return;
    setEditing(d);
    setName(d.name);
    setPhone(d.phone ?? "");
    setGender((d.gender ?? "") as any);
    setSpecialty(d.specialty ?? "");
    setModalOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!isAdmin) return;
    setError(null);
    const payload = {
      name: name.trim() ? name.trim() : undefined,
      phone: phone.trim() ? phone.trim() : null,
      gender: gender ? gender : null,
      specialty: specialty.trim() ? specialty.trim() : null,
    };
    setSaving(true);
    try {
      await apiFetch(`/api/doctors/${encodeURIComponent(editing.id)}`, { method: "PUT", json: payload });
      setModalOpen(false);
      setEditing(null);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao salvar médico.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d: Doctor) => {
    if (!confirm("Excluir este médico?")) return;
    if (!isAdmin) return;
    setError(null);
    try {
      await apiFetch(`/api/doctors/${encodeURIComponent(d.id)}`, { method: "DELETE" });
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao excluir médico.");
    }
  };

  const invite = async () => {
    setInviteLink(null);
    setError(null);
    if (!isAdmin) return;
    setInviteLoading(true);
    try {
      const r = await apiFetch<{ inviteUrl: string }>("/api/doctor-invites", { method: "POST", json: {} });
      setInviteLink(r.inviteUrl);
      await navigator.clipboard.writeText(r.inviteUrl);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao gerar convite.");
    } finally {
      setInviteLoading(false);
    }
  };

  const shortId = useMemo(() => (id: string) => id.replace(/-/g, "").slice(0, 8).toUpperCase(), []);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Médicos</h1>
          <p className="mt-1 text-sm text-gray-600">Gerencie médicos, especialidades e convites por link.</p>
        </div>
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl bg-card" onClick={() => void invite()} disabled={inviteLoading}>
              <ClipboardText weight="bold" />
              {inviteLoading ? "Gerando…" : "Convidar médico"}
            </Button>
          </div>
        ) : null}
      </div>

      {inviteLink ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Link copiado: {inviteLink}</div> : null}
      {!isAdmin ? <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">Somente administradores podem editar/excluir e definir especialidade.</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {streamError ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{streamError}</div> : null}

      <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-foreground">Lista</div>
          {isAdmin && unitsList.length > 0 ? (
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
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Especialidade</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Gênero</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <tr key={i} className="bg-card">
                      <td className="px-4 py-4"><div className="h-5 w-14 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-9 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                    </tr>
                  ))}
                </>
              ) : doctors.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={7}>
                    Nenhum médico ainda.
                  </td>
                </tr>
              ) : (
                doctors.map(d => (
                  <tr key={d.id} className="bg-card transition hover:bg-muted/50">
                    <td className="px-4 py-4 font-semibold text-foreground">{shortId(d.id)}</td>
                    <td className="px-4 py-4 text-foreground">{d.name}</td>
                    <td className="px-4 py-4 text-foreground">{d.specialty ?? "—"}</td>
                    <td className="px-4 py-4 text-foreground">{d.email}</td>
                    <td className="px-4 py-4 text-foreground">{d.phone ?? "—"}</td>
                    <td className="px-4 py-4 text-foreground">{d.gender ?? "—"}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted"
                          onClick={() => openEdit(d)}
                          aria-label="Editar"
                          disabled={!isAdmin}
                        >
                          <PencilSimple size={16} weight="bold" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-destructive/30 bg-card text-destructive hover:bg-destructive/10"
                          onClick={() => void remove(d)}
                          aria-label="Excluir"
                          disabled={!isAdmin}
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? `Editar médico • ${editing.email}` : "Editar médico"}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      >
        {editing && isAdmin ? (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Nome</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Telefone</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Gênero</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as any)}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Especialidade</label>
              <select
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                {specialties.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" className="rounded-xl bg-card" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => void save()} disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
