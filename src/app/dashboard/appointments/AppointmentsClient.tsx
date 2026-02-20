"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/app/ui/apiClient";
import { useSseSnapshot } from "@/app/ui/useSseSnapshot";
import { Button } from "@/components/ui/button";
import { Calendar, Check, MagnifyingGlass, Play } from "@phosphor-icons/react";

type Patient = {
  id: string;
  patientNumber: string;
  name: string;
  email: string | null;
  cpf: string | null;
  rg: string | null;
  phone?: string | null;
  gender?: "MASCULINO" | "FEMININO" | "OUTRO" | null;
  age?: number | null;
};

type Doctor = { id: string; name: string; email: string; specialty: string | null; unitId?: string | null };

type AppointmentStatus =
  | "AGENDADO"
  | "PRIMEIRA_CONSULTA"
  | "RETORNO"
  | "URGENCIA"
  | "EMERGENCIA"
  | "AVALIACAO"
  | "ENCAMINHAMENTO"
  | "PRE_OPERATORIO"
  | "POS_OPERATORIO"
  | "MANUTENCAO"
  | "TELECONSULTA_ONLINE"
  | "RETORNO_REMARCADO";

type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  unitId?: string | null;
  scheduledAt: string | null;
  status: AppointmentStatus;
  workflowStatus?: "RECEPCAO" | "AGUARDANDO" | "EM_ATENDIMENTO" | "FINALIZADO";
  notes: string | null;
};

type Unit = { id: string; name: string };

function formatStatus(s: AppointmentStatus) {
  const map: Record<AppointmentStatus, string> = {
    AGENDADO: "Agendado",
    PRIMEIRA_CONSULTA: "Primeira consulta",
    RETORNO: "Retorno",
    URGENCIA: "Urgência",
    EMERGENCIA: "Emergência",
    AVALIACAO: "Avaliação",
    ENCAMINHAMENTO: "Encaminhamento",
    PRE_OPERATORIO: "Pré-operatório",
    POS_OPERATORIO: "Pós-operatório",
    MANUTENCAO: "Manutenção",
    TELECONSULTA_ONLINE: "Teleconsulta/Online",
    RETORNO_REMARCADO: "Retorno remarcado",
  };
  return map[s];
}

function formatGender(v: Patient["gender"]) {
  if (!v) return "—";
  if (v === "MASCULINO") return "Masculino";
  if (v === "FEMININO") return "Feminino";
  return "Outro";
}

function workflowLabel(v: Appointment["workflowStatus"]) {
  if (v === "RECEPCAO") return "Recepção";
  if (v === "AGUARDANDO") return "Aguardando";
  if (v === "EM_ATENDIMENTO") return "Em atendimento";
  if (v === "FINALIZADO") return "Finalizado";
  return "Aguardando";
}

function workflowClasses(v: Appointment["workflowStatus"]) {
  if (v === "EM_ATENDIMENTO") return "bg-indigo-100 text-indigo-700";
  if (v === "FINALIZADO") return "bg-emerald-100 text-emerald-700";
  if (v === "RECEPCAO") return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-foreground";
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number) {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function AppointmentsClient({ tourEnabled }: { tourEnabled: boolean }) {
  const [meRoles, setMeRoles] = useState<string[]>([]);
  const isDoctorRole = meRoles.includes("DOCTOR");
  const isOrgAdmin = meRoles.includes("ORG_ADMIN");

  const [forceDoctorView, setForceDoctorView] = useState(false);
  const showDoctorView = isDoctorRole || (tourEnabled && forceDoctorView);
  const isTourDoctorView = showDoctorView && tourEnabled && !isDoctorRole;

  const [filterDate, setFilterDate] = useState(todayString);
  const [filterPatientName, setFilterPatientName] = useState("");
  const [filterPatientCpf, setFilterPatientCpf] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [unitsList, setUnitsList] = useState<Unit[]>([]);

  const appointmentsStreamUrl =
    isOrgAdmin && selectedUnitId
      ? `/api/stream/appointments?unitId=${encodeURIComponent(selectedUnitId)}`
      : "/api/stream/appointments";

  const patientsStreamUrl =
    isOrgAdmin && selectedUnitId
      ? `/api/stream/patients?unitId=${encodeURIComponent(selectedUnitId)}&all=1`
      : "/api/stream/patients?all=1";

  const { data: doctorsSnap } = useSseSnapshot<{ doctors: Doctor[] }>("/api/stream/doctors");
  const { data: patientsSnap } = useSseSnapshot<{ patients: Patient[] }>(patientsStreamUrl);
  const { data: appointmentsSnap } = useSseSnapshot<{ appointments: Appointment[] }>(appointmentsStreamUrl);

  const doctors = doctorsSnap?.doctors ?? [];
  const patientsAll = patientsSnap?.patients ?? [];
  const appointments = appointmentsSnap?.appointments ?? [];

  const patientById = useMemo(() => new Map(patientsAll.map(p => [p.id, p])), [patientsAll]);
  const doctorById = useMemo(() => new Map(doctors.map(d => [d.id, d])), [doctors]);

  const appointmentsSorted = useMemo(() => {
    const list = [...appointments];
    list.sort((a, b) => {
      const da = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const db = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return da - db;
    });
    return list;
  }, [appointments]);

  useEffect(() => {
    const run = async () => {
      try {
        const me = await apiFetch<{ user: { roles: string[] } }>("/api/auth/me");
        setMeRoles(me.user.roles);
      } catch {
        setMeRoles([]);
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

  const [doctorMe, setDoctorMe] = useState<Doctor | null>(null);
  const [doctorMeLoaded, setDoctorMeLoaded] = useState(false);
  useEffect(() => {
    const run = async () => {
      if (!isDoctorRole) return;
      try {
        const data = await apiFetch<{ doctor: Doctor }>("/api/doctors/me");
        setDoctorMe(data.doctor);
      } catch {
        setDoctorMe(null);
      } finally {
        setDoctorMeLoaded(true);
      }
    };
    void run();
  }, [isDoctorRole]);

  const demoDoctor = useMemo(() => {
    if (!tourEnabled || isDoctorRole) return null;
    if (!doctors.length) return null;
    const sorted = [...doctors].sort((a, b) => a.name.localeCompare(b.name));
    return sorted[0]!;
  }, [doctors, isDoctorRole, tourEnabled]);

  const activeDoctor = showDoctorView ? (isDoctorRole ? doctorMe : demoDoctor) : null;

  const appointmentsForDoctor = useMemo(() => {
    if (!activeDoctor) return [];
    const nameQ = filterPatientName.trim().toLowerCase();
    const cpfQ = filterPatientCpf.trim().replace(/\D/g, "");
    const filterDay = filterDate;

    return appointmentsSorted.filter(a => {
      if (a.doctorId !== activeDoctor.id) return false;
      const scheduledDay = a.scheduledAt ? new Date(a.scheduledAt).toISOString().slice(0, 10) : null;
      if (scheduledDay !== filterDay) return false;
      const p = patientById.get(a.patientId);
      if (nameQ && (!p || !(p.name ?? "").toLowerCase().includes(nameQ))) return false;
      if (cpfQ && (!p || !(p.cpf ?? "").replace(/\D/g, "").includes(cpfQ))) return false;
      return true;
    });
  }, [activeDoctor, appointmentsSorted, filterDate, filterPatientName, filterPatientCpf, patientById]);

  const activeAppointment = useMemo(() => {
    return appointmentsForDoctor.find(a => (a.workflowStatus ?? "AGUARDANDO") === "EM_ATENDIMENTO") ?? null;
  }, [appointmentsForDoctor]);

  const nextAppointment = useMemo(() => {
    if (activeAppointment) return null;
    return (
      appointmentsForDoctor.find(a => {
        const ws = a.workflowStatus ?? "AGUARDANDO";
        return ws === "RECEPCAO" || ws === "AGUARDANDO";
      }) ?? null
    );
  }, [activeAppointment, appointmentsForDoctor]);

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const doWorkflow = async (appointmentId: string, action: "START" | "FINISH") => {
    setError(null);
    setActionLoading(prev => ({ ...prev, [appointmentId]: true }));
    try {
      await apiFetch(`/api/appointments/${encodeURIComponent(appointmentId)}/workflow`, { method: "POST", json: { action } });
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Não foi possível atualizar o atendimento.");
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  const [patientsQuery, setPatientsQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [patientComboboxOpen, setPatientComboboxOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState<AppointmentStatus>("AGENDADO");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const patientsFiltered = useMemo(() => {
    const q = patientsQuery.trim().toLowerCase();
    if (!q) return patientsAll;
    return patientsAll.filter(p => {
      const name = (p.name ?? "").toLowerCase();
      const email = (p.email ?? "").toLowerCase();
      const cpf = (p.cpf ?? "").toLowerCase();
      const rg = (p.rg ?? "").toLowerCase();
      const phone = (p.phone ?? "").toLowerCase();
      const num = (p.patientNumber ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || cpf.includes(q) || rg.includes(q) || phone.includes(q) || num.includes(q);
    });
  }, [patientsAll, patientsQuery]);

  const selectedPatient = useMemo(
    () => patientsAll.find(p => p.id === selectedPatientId) ?? null,
    [patientsAll, selectedPatientId],
  );

  const submit = async () => {
    setError(null);
    if (!selectedPatientId) {
      setError("Selecione um paciente.");
      return;
    }
    if (!selectedDoctorId) {
      setError("Selecione um médico especialista.");
      return;
    }
    if (!scheduledAt) {
      setError("Selecione data e hora.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/appointments", {
        method: "POST",
        json: {
          patientId: selectedPatientId,
          doctorId: selectedDoctorId,
          scheduledAt: new Date(scheduledAt).toISOString(),
          status,
          notes: notes.trim() ? notes.trim() : null,
        },
      });
      setNotes("");
      setScheduledAt("");
      setSelectedPatientId("");
      setSelectedDoctorId("");
      setStatus("AGENDADO");
      setPatientsQuery("");
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao agendar consulta.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Agendamentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {showDoctorView ? "Seus atendimentos agendados." : "Selecione paciente, médico, data e status para criar um agendamento."}
          </p>
        </div>
        {tourEnabled && !isDoctorRole ? (
          <Button variant="outline" className="rounded-xl bg-card" onClick={() => setForceDoctorView(v => !v)}>
            {forceDoctorView ? "Ver como ADMIN" : "Ver como DOCTOR"}
          </Button>
        ) : null}
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {showDoctorView ? (
        <section className="grid gap-4">
          {isDoctorRole && !doctorMeLoaded ? (
            <div className="flex flex-wrap gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="min-h-[140px] min-w-[200px] max-w-[400px] flex-1 basis-full rounded-2xl border border-border bg-card p-4 shadow-sm sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-3rem)/4)]">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="mt-2 h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="mt-3 h-10 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          ) : null}
          {isDoctorRole && doctorMeLoaded && !doctorMe ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Perfil de médico não encontrado.</div>
          ) : null}

          {activeDoctor ? (
            <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
              <div className="text-sm font-semibold text-foreground">
                {tourEnabled && !isDoctorRole ? `Visualizando como: ${activeDoctor.name}` : "Minha agenda"}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setFilterDate(todayString())}
                  >
                    Hoje
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setFilterDate(addDays(filterDate, 1))}
                  >
                    Próximo dia
                  </Button>
                </div>
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="h-9 rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  placeholder="Filtrar por nome do paciente"
                  value={filterPatientName}
                  onChange={e => setFilterPatientName(e.target.value)}
                  className="h-9 min-w-[180px] rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  placeholder="Filtrar por CPF"
                  value={filterPatientCpf}
                  onChange={e => setFilterPatientCpf(e.target.value)}
                  className="h-9 min-w-[140px] rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
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
              </div>

              <div className="mt-4 space-y-6">
                {appointmentsForDoctor.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-muted px-4 py-4 text-sm text-muted-foreground">
                    Nenhum agendamento para esta data e filtros.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {new Date(`${filterDate}T00:00:00`).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {appointmentsForDoctor.map(a => {
                        const p = patientById.get(a.patientId) ?? null;
                        const ws = a.workflowStatus ?? "AGUARDANDO";
                        const isActive = activeAppointment?.id === a.id;
                        const isNext = !activeAppointment && nextAppointment?.id === a.id;
                        const locked = activeAppointment ? !isActive : !isNext;

                        return (
                          <div
                            key={a.id}
                            className="min-h-px min-w-[200px] max-w-[400px] flex-1 basis-full rounded-2xl border border-border bg-card p-4 shadow-sm ring-1 ring-border sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-3rem)/4)]"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  {a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"} •{" "}
                                  {formatStatus(a.status)}
                                </div>
                                <div className="mt-1 truncate text-sm font-semibold text-foreground">{p ? `${p.patientNumber} • ${p.name}` : a.patientId}</div>
                              </div>
                              <span className={["shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold", workflowClasses(ws)].join(" ")}>
                                {workflowLabel(ws)}
                              </span>
                            </div>

                            <div className="mt-2 text-xs text-muted-foreground">
                              {p?.phone ?? "—"} • {formatGender(p?.gender ?? null)} • {typeof p?.age === "number" ? `${p.age} anos` : "—"}
                            </div>

                            <div className="mt-3">
                              {isActive ? (
                                <Button
                                  className="h-10 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                                  onClick={() => void doWorkflow(a.id, "FINISH")}
                                  disabled={Boolean(actionLoading[a.id]) || isTourDoctorView}
                                >
                                  <Check weight="bold" />
                                  {isTourDoctorView ? "Somente visualização" : actionLoading[a.id] ? "Finalizando…" : "Finalizar atendimento"}
                                </Button>
                              ) : isNext ? (
                                <Button
                                  className="h-10 w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                                  onClick={() => void doWorkflow(a.id, "START")}
                                  disabled={Boolean(actionLoading[a.id]) || isTourDoctorView}
                                >
                                  <Play weight="bold" />
                                  {isTourDoctorView ? "Somente visualização" : actionLoading[a.id] ? "Iniciando…" : "Iniciar atendimento"}
                                </Button>
                              ) : (
                                <Button variant="outline" className="h-10 w-full rounded-xl bg-card" disabled>
                                  {locked ? "Aguardando liberação" : "Indisponível"}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="min-h-[140px] min-w-[200px] max-w-[400px] flex-1 basis-full rounded-2xl border border-border bg-card p-4 shadow-sm sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-3rem)/4)]">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="mt-2 h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="mt-3 h-10 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="grid gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
            <div className="grid gap-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paciente</div>
              <div className="relative w-full">
                <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
                  <MagnifyingGlass size={18} weight="bold" />
                </div>
                <input
                  type="text"
                  value={selectedPatient ? `${selectedPatient.patientNumber} • ${selectedPatient.name}` : patientsQuery}
                  onChange={e => {
                    setPatientsQuery(e.target.value);
                    setSelectedPatientId("");
                  }}
                  onFocus={() => {
                    setPatientComboboxOpen(true);
                    if (selectedPatientId) {
                      setSelectedPatientId("");
                      setPatientsQuery("");
                    }
                  }}
                  onBlur={() => setTimeout(() => setPatientComboboxOpen(false), 180)}
                  placeholder="Digite para buscar (nome, número, email, CPF, RG)…"
                  className="h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoComplete="off"
                />
                {patientComboboxOpen ? (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-2xl border border-border bg-card py-2 shadow-lg">
                    {patientsFiltered.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">Nenhum paciente encontrado.</div>
                    ) : (
                      patientsFiltered.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted"
                          onMouseDown={e => {
                            e.preventDefault();
                            setSelectedPatientId(p.id);
                            setPatientsQuery("");
                            setPatientComboboxOpen(false);
                          }}
                        >
                          <span className="font-medium">{p.patientNumber}</span> • {p.name}
                          {(p.email ?? p.cpf ?? p.rg) ? (
                            <span className="ml-1 text-muted-foreground">
                              • {[p.email, p.cpf, p.rg].filter(Boolean).join(" • ")}
                            </span>
                          ) : null}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
              {selectedPatient ? (
                <div className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
                  <div className="font-semibold text-foreground">{selectedPatient.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selectedPatient.email ?? "—"} • {selectedPatient.cpf ?? "—"} • {selectedPatient.rg ?? "—"}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data e hora</div>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Calendar size={18} weight="bold" />
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</div>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="h-11 rounded-2xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="AGENDADO">Agendado</option>
                  <option value="PRIMEIRA_CONSULTA">Primeira consulta</option>
                  <option value="RETORNO">Retorno</option>
                  <option value="URGENCIA">Urgência</option>
                  <option value="EMERGENCIA">Emergência</option>
                  <option value="AVALIACAO">Avaliação</option>
                  <option value="ENCAMINHAMENTO">Encaminhamento</option>
                  <option value="PRE_OPERATORIO">Pré-operatório</option>
                  <option value="POS_OPERATORIO">Pós-operatório</option>
                  <option value="MANUTENCAO">Manutenção</option>
                  <option value="TELECONSULTA_ONLINE">Teleconsulta/Online</option>
                  <option value="RETORNO_REMARCADO">Retorno remarcado</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Médico especialista</div>
              <select
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecione um médico</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.specialty ? `• ${d.specialty}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observação</div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center justify-end">
              <Button className="rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700" onClick={() => void submit()} disabled={saving}>
                {saving ? "Agendando…" : "Agendar"}
              </Button>
            </div>
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
            <div className="text-sm font-semibold text-foreground">Agendamentos</div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-border">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Data/Hora</th>
                    <th className="px-4 py-3">Paciente</th>
                    <th className="px-4 py-3">Médico</th>
                    <th className="px-4 py-3">Fluxo</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Obs.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appointmentsSorted.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                        Nenhum agendamento ainda.
                      </td>
                    </tr>
                  ) : (
                    appointmentsSorted.map(a => (
                      <tr key={a.id} className="bg-card">
                        <td className="px-4 py-4 text-foreground">
                          {a.scheduledAt ? new Date(a.scheduledAt).toLocaleString("pt-BR") : "—"}
                        </td>
                        <td className="px-4 py-4 text-foreground">{patientById.get(a.patientId)?.name ?? a.patientId}</td>
                        <td className="px-4 py-4 text-foreground">{doctorById.get(a.doctorId)?.name ?? a.doctorId}</td>
                        <td className="px-4 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                              workflowClasses(a.workflowStatus ?? "AGUARDANDO"),
                            ].join(" ")}
                          >
                            {workflowLabel(a.workflowStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-foreground">{formatStatus(a.status)}</td>
                        <td className="px-4 py-4 text-foreground">{a.notes ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
