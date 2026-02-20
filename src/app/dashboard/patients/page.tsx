"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/app/ui/apiClient";
import { useSseSnapshot } from "@/app/ui/useSseSnapshot";
import { Button } from "@/components/ui/button";
import { MagnifyingGlass, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";

type Gender = "MASCULINO" | "FEMININO" | "OUTRO";
type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
type TreatmentType = "CONSULTA" | "EXAME" | "CIRURGIA" | "TERAPIA" | "VACINACAO" | "OUTRO";

type Patient = {
  id: string;
  patientNumber: string;
  name: string;
  gender: Gender | null;
  age: number | null;
  bloodType: BloodType | null;
  treatment: TreatmentType | null;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  rg: string | null;
  address: { street: string; district: string; city: string; state: string; number: string } | null;
};

type Unit = { id: string; name: string };

function shortId(id: string) {
  if (!id) return "—";
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function formatGender(v: Gender | null) {
  if (!v) return "—";
  if (v === "MASCULINO") return "Masculino";
  if (v === "FEMININO") return "Feminino";
  return "Outro";
}

function formatTreatment(v: TreatmentType | null) {
  if (!v) return "—";
  if (v === "CONSULTA") return "Consulta";
  if (v === "EXAME") return "Exame";
  if (v === "CIRURGIA") return "Cirurgia";
  if (v === "TERAPIA") return "Terapia";
  if (v === "VACINACAO") return "Vacinação";
  return "Outro";
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
      <div className="absolute left-1/2 top-1/2 w-[min(980px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2">
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

type PatientDraft = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  rg: string;
  gender: "" | Gender;
  age: string;
  bloodType: "" | BloodType;
  treatment: "" | TreatmentType;
  street: string;
  district: string;
  city: string;
  state: string;
  number: string;
};

const emptyDraft: PatientDraft = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  rg: "",
  gender: "",
  age: "",
  bloodType: "",
  treatment: "",
  street: "",
  district: "",
  city: "",
  state: "",
  number: "",
};

function toPayload(d: PatientDraft) {
  const addr = d.street.trim() || d.district.trim() || d.city.trim() || d.state.trim() || d.number.trim();
  return {
    name: d.name.trim(),
    email: d.email.trim() ? d.email.trim() : null,
    phone: d.phone.trim() ? d.phone.trim() : null,
    cpf: d.cpf.trim() ? d.cpf.trim() : null,
    rg: d.rg.trim() ? d.rg.trim() : null,
    gender: d.gender ? d.gender : null,
    age: d.age.trim() ? Number(d.age) : null,
    bloodType: d.bloodType ? d.bloodType : null,
    treatment: d.treatment ? d.treatment : null,
    address: addr
      ? {
          street: d.street.trim(),
          district: d.district.trim(),
          city: d.city.trim(),
          state: d.state.trim(),
          number: d.number.trim(),
        }
      : null,
  };
}

export default function PatientsPage() {
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [unitsList, setUnitsList] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const patientsStreamUrl =
    isOrgAdmin && selectedUnitId
      ? `/api/stream/patients?unitId=${encodeURIComponent(selectedUnitId)}`
      : "/api/stream/patients";

  const { data, error: streamError, connected } = useSseSnapshot<{ patients: Patient[] }>(patientsStreamUrl);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [draft, setDraft] = useState<PatientDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const patients = data?.patients ?? [];
  const loading = !connected && !streamError;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(p => {
      const name = (p.name ?? "").toLowerCase();
      const email = (p.email ?? "").toLowerCase();
      const phone = (p.phone ?? "").toLowerCase();
      const cpf = (p.cpf ?? "").toLowerCase();
      const rg = (p.rg ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || cpf.includes(q) || rg.includes(q);
    });
  }, [patients, query]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setModalOpen(true);
  };

  const openEdit = (p: Patient) => {
    setEditing(p);
    setDraft({
      name: p.name ?? "",
      email: p.email ?? "",
      phone: p.phone ?? "",
      cpf: p.cpf ?? "",
      rg: p.rg ?? "",
      gender: (p.gender ?? "") as any,
      age: p.age === null || typeof p.age === "undefined" ? "" : String(p.age),
      bloodType: (p.bloodType ?? "") as any,
      treatment: (p.treatment ?? "") as any,
      street: p.address?.street ?? "",
      district: p.address?.district ?? "",
      city: p.address?.city ?? "",
      state: p.address?.state ?? "",
      number: p.address?.number ?? "",
    });
    setModalOpen(true);
  };

  const save = async () => {
    setError(null);
    const payload = toPayload(draft);
    if (!payload.name) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/patients/${encodeURIComponent(editing.id)}`, { method: "PUT", json: payload });
      } else {
        await apiFetch("/api/patients", { method: "POST", json: payload });
      }
      setModalOpen(false);
      setEditing(null);
      setDraft(emptyDraft);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao salvar paciente.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Patient) => {
    if (!confirm("Excluir este paciente?")) return;
    setError(null);
    try {
      await apiFetch(`/api/patients/${encodeURIComponent(p.id)}`, { method: "DELETE" });
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao excluir paciente.");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pacientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie seus pacientes cadastrados.</p>
        </div>
        <Button className="rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700" onClick={openCreate}>
          <Plus weight="bold" />
          Cadastrar paciente
        </Button>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {streamError ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{streamError}</div> : null}

      <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full min-w-[200px] max-w-lg">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <MagnifyingGlass size={18} weight="bold" />
              </div>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por nome, email, CPF, RG…"
                className="h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {isOrgAdmin && unitsList.length > 0 ? (
              <select
                value={selectedUnitId}
                onChange={e => setSelectedUnitId(e.target.value)}
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{connected ? "Ao vivo" : "Conectando…"}</div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Gênero</th>
                <th className="px-4 py-3">Idade</th>
                <th className="px-4 py-3">Grupo sanguíneo</th>
                <th className="px-4 py-3">Tratamento</th>
                <th className="px-4 py-3">Móvel</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Endereço</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <tr key={i} className="bg-card">
                      <td className="px-4 py-4"><div className="h-5 w-14 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-5 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-5 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-5 w-10 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-5 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-5 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                      <td className="px-4 py-4"><div className="h-9 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
                    </tr>
                  ))}
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={10}>
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="bg-card transition hover:bg-muted/50">
                    <td className="px-4 py-4 font-semibold text-foreground">{p.patientNumber || shortId(p.id)}</td>
                    <td className="px-4 py-4 text-foreground">{p.name}</td>
                    <td className="px-4 py-4 text-foreground">{formatGender(p.gender)}</td>
                    <td className="px-4 py-4 text-foreground">{p.age ?? "—"}</td>
                    <td className="px-4 py-4 text-foreground">{p.bloodType ?? "—"}</td>
                    <td className="px-4 py-4 text-foreground">{formatTreatment(p.treatment)}</td>
                    <td className="px-4 py-4 text-muted-foreground">—</td>
                    <td className="px-4 py-4 text-foreground">{p.email ?? "—"}</td>
                    <td className="px-4 py-4 text-foreground">
                      {p.address ? `${p.address.street}, ${p.address.number} - ${p.address.district}, ${p.address.city}/${p.address.state}` : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted"
                          onClick={() => openEdit(p)}
                          aria-label="Editar"
                        >
                          <PencilSimple size={16} weight="bold" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-destructive/30 bg-card text-destructive hover:bg-destructive/10"
                          onClick={() => void remove(p)}
                          aria-label="Excluir"
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
        title={editing ? "Editar paciente" : "Adicionar paciente"}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setDraft(emptyDraft);
        }}
      >
        <div className="grid gap-4">
          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Nome *</label>
              <input
                value={draft.name}
                onChange={e => setDraft(v => ({ ...v, name: e.target.value }))}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                value={draft.email}
                onChange={e => setDraft(v => ({ ...v, email: e.target.value }))}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Telefone</label>
              <input
                value={draft.phone}
                onChange={e => setDraft(v => ({ ...v, phone: e.target.value }))}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">CPF</label>
              <input
                value={draft.cpf}
                onChange={e => setDraft(v => ({ ...v, cpf: e.target.value }))}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">RG</label>
              <input
                value={draft.rg}
                onChange={e => setDraft(v => ({ ...v, rg: e.target.value }))}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Gênero</label>
              <select
                value={draft.gender}
                onChange={e => setDraft(v => ({ ...v, gender: e.target.value as any }))}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Idade</label>
              <input
                value={draft.age}
                onChange={e => setDraft(v => ({ ...v, age: e.target.value }))}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Grupo sanguíneo</label>
              <select
                value={draft.bloodType}
                onChange={e => setDraft(v => ({ ...v, bloodType: e.target.value as any }))}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Tratamento</label>
              <select
                value={draft.treatment}
                onChange={e => setDraft(v => ({ ...v, treatment: e.target.value as any }))}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                <option value="CONSULTA">Consulta</option>
                <option value="EXAME">Exame</option>
                <option value="CIRURGIA">Cirurgia</option>
                <option value="TERAPIA">Terapia</option>
                <option value="VACINACAO">Vacinação</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endereço</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Rua</label>
                <input
                  value={draft.street}
                  onChange={e => setDraft(v => ({ ...v, street: e.target.value }))}
                  className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Bairro</label>
                <input
                  value={draft.district}
                  onChange={e => setDraft(v => ({ ...v, district: e.target.value }))}
                  className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Número</label>
                <input
                  value={draft.number}
                  onChange={e => setDraft(v => ({ ...v, number: e.target.value }))}
                  className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Cidade</label>
                <input
                  value={draft.city}
                  onChange={e => setDraft(v => ({ ...v, city: e.target.value }))}
                  className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Estado</label>
                <input
                  value={draft.state}
                  onChange={e => setDraft(v => ({ ...v, state: e.target.value }))}
                  className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              className="rounded-xl bg-card"
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
                setDraft(emptyDraft);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => void save()} disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
