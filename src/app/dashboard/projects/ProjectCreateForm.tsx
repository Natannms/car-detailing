"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { apiFetch, ApiError } from "../../ui/apiClient";
import { Button } from "@/components/ui/button";
import { useProjectCreateStore } from "./projectCreateStore";
import Link from "next/link";

type ClientOption = { id: string; name: string; code: string | null };

function toNumberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function toIntOrNull(value: string) {
  const n = toNumberOrNull(value);
  if (n === null) return null;
  return Math.trunc(n);
}

function toDateOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

function section(title: string, content: string) {
  const c = content.trim();
  if (!c) return null;
  return `## ${title}\n${c}`;
}

function buildDescription(draft: ReturnType<typeof useProjectCreateStore>["draft"]) {
  const blocks = [
    section("Descrição detalhada", draft.descriptionDetailed),
    section("Problema que resolve", draft.problem),
    section("Público-alvo", draft.targetAudience),
    section("Objetivos", draft.objectives),
    section("Critérios de sucesso (KPIs)", draft.kpis || draft.successCriteria),
    section("Integrações externas", draft.externalIntegrations),
    section("Ambiente de deploy", draft.deployEnvironment),
  ].filter(Boolean);
  return blocks.length ? blocks.join("\n\n") : null;
}

const step1Schema = z.object({
  name: z.string().min(1, "Nome do projeto é obrigatório").max(200),
  code: z.string().min(1, "Código interno é obrigatório").max(80),
  summary: z.string().min(1, "Descrição resumida é obrigatória").max(500),
  type: z.enum(["SAAS", "CLIENT", "INTERNAL", "MVP", "POC"]),
  methodology: z.enum(["SCRUM", "KANBAN", "HYBRID", "WATERFALL"]),
  clientId: z.string().uuid().nullable(),
});

const step4Schema = z.object({
  startDate: z.string().min(1, "Data de início é obrigatória"),
});

export function ProjectCreateForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const { step, draft, setStep, next, back, setDraft, reset } = useProjectCreateStore();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const steps = useMemo(
    () => [
      { n: 1, label: "Básico" },
      { n: 2, label: "Escopo" },
      { n: 3, label: "Técnicos" },
      { n: 4, label: "Datas" },
      { n: 5, label: "Controle" },
      { n: 6, label: "Configurações" },
    ],
    [],
  );

  useEffect(() => {
    const loadClients = async () => {
      setClientsLoading(true);
      try {
        const r = await apiFetch<{ clients: ClientOption[] }>("/api/clients");
        setClients(r.clients);
      } catch {
        setClients([]);
      } finally {
        setClientsLoading(false);
      }
    };

    void loadClients();
  }, []);

  const validateAndNext = () => {
    setError(null);
    try {
      if (step === 1) step1Schema.parse({ ...draft, clientId: draft.clientId });
      if (step === 4) step4Schema.parse({ startDate: draft.startDate });
      next();
    } catch (e) {
      if (e instanceof z.ZodError) setError(e.issues[0]?.message ?? "Campos inválidos.");
      else setError("Campos inválidos.");
    }
  };

  const submit = async () => {
    setError(null);
    try {
      step1Schema.parse({ ...draft, clientId: draft.clientId });
      step4Schema.parse({ startDate: draft.startDate });
    } catch (e) {
      if (e instanceof z.ZodError) setError(e.issues[0]?.message ?? "Campos inválidos.");
      else setError("Campos inválidos.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: draft.name.trim(),
        code: draft.code.trim(),
        summary: draft.summary.trim(),
        description: buildDescription(draft),
        clientId: draft.clientId ?? null,
        type: draft.type,
        methodology: draft.methodology,
        startDate: draft.startDate,
        estimatedEndDate: toDateOrNull(draft.estimatedEndDate),
        actualEndDate: toDateOrNull(draft.actualEndDate),
        priority: draft.priority || undefined,
        complexity: draft.complexity ? Number(draft.complexity) : null,
        riskLevel: draft.riskLevel || null,
        status: draft.status || undefined,
        health: draft.health || undefined,
        billingModel: draft.billingModel || null,
        contractValue: toNumberOrNull(draft.contractValue),
        slaHours: toIntOrNull(draft.slaHours),
        estimatedHours: toNumberOrNull(draft.estimatedHours),
        actualHours: toNumberOrNull(draft.actualHours),
        estimatedBudget: toNumberOrNull(draft.estimatedBudget),
        actualCost: toNumberOrNull(draft.actualCost),
        expectedMargin: toNumberOrNull(draft.expectedMargin),
        actualMargin: toNumberOrNull(draft.actualMargin),
        mainStack: draft.mainStack.trim() || null,
        architecture: draft.architecture || null,
        databaseType: draft.databaseType.trim() || null,
        cloudProvider: draft.cloudProvider.trim() || null,
        repositoryUrl: draft.repositoryUrl.trim() || null,
        allowMultipleTeams: draft.allowMultipleTeams,
        allowMultipleBoards: draft.allowMultipleBoards,
        financialControl: draft.financialControl,
        visibility: draft.visibility || undefined,
      };

      await apiFetch("/api/projects", { method: "POST", json: payload });
      reset();
      onCreated();
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao criar projeto.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        {steps.map(s => (
          <button
            key={s.n}
            type="button"
            onClick={() => setStep(s.n as any)}
            className={[
              "rounded-xl px-3 py-2 text-xs font-semibold transition",
              step === s.n ? "bg-indigo-600 text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80",
            ].join(" ")}
          >
            {s.n}. {s.label}
          </button>
        ))}
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {step === 1 ? (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Nome do Projeto *</label>
            <input
              value={draft.name}
              onChange={e => setDraft({ name: e.target.value })}
              className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Código interno *</label>
            <input
              value={draft.code}
              onChange={e => setDraft({ code: e.target.value })}
              placeholder="ex: WALM-APP-01"
              className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Cliente</label>
            <select
              value={draft.clientId ?? ""}
              onChange={e => setDraft({ clientId: e.target.value ? e.target.value : null })}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={clientsLoading}
            >
              <option value="">{clientsLoading ? "Carregando…" : "Nenhum"}</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.code ? ` (${c.code})` : ""}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
              <span>Não encontrou o cliente?</span>
              <Link
                href={`/dashboard/clients/new?returnTo=${encodeURIComponent("/dashboard/projects")}`}
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Cadastrar cliente
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Tipo do Projeto</label>
              <select
                value={draft.type}
                onChange={e => setDraft({ type: e.target.value as any })}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="SAAS">SaaS</option>
                <option value="CLIENT">Cliente externo</option>
                <option value="INTERNAL">Produto interno</option>
                <option value="MVP">MVP</option>
                <option value="POC">POC</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Metodologia</label>
              <select
                value={draft.methodology}
                onChange={e => setDraft({ methodology: e.target.value as any })}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="SCRUM">Scrum</option>
                <option value="KANBAN">Kanban</option>
                <option value="HYBRID">Híbrido</option>
                <option value="WATERFALL">Waterfall</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Descrição resumida *</label>
            <textarea
              value={draft.summary}
              onChange={e => setDraft({ summary: e.target.value })}
              rows={4}
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Descrição detalhada</label>
            <textarea
              value={draft.descriptionDetailed}
              onChange={e => setDraft({ descriptionDetailed: e.target.value })}
              rows={5}
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Problema que resolve</label>
              <textarea
                value={draft.problem}
                onChange={e => setDraft({ problem: e.target.value })}
                rows={4}
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Público-alvo</label>
              <textarea
                value={draft.targetAudience}
                onChange={e => setDraft({ targetAudience: e.target.value })}
                rows={4}
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Objetivos do projeto</label>
              <textarea
                value={draft.objectives}
                onChange={e => setDraft({ objectives: e.target.value })}
                rows={4}
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Critérios de sucesso (KPIs)</label>
              <textarea
                value={draft.kpis}
                onChange={e => setDraft({ kpis: e.target.value })}
                rows={4}
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">SLA acordado (horas)</label>
              <input
                value={draft.slaHours}
                onChange={e => setDraft({ slaHours: e.target.value })}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Valor do contrato</label>
              <input
                value={draft.contractValue}
                onChange={e => setDraft({ contractValue: e.target.value })}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Modelo de cobrança</label>
            <select
              value={draft.billingModel}
              onChange={e => setDraft({ billingModel: e.target.value as any })}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">—</option>
              <option value="FIXED">Fixo</option>
              <option value="HOURLY">Hora</option>
              <option value="MONTHLY">Mensal</option>
            </select>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Stack principal</label>
              <input
                value={draft.mainStack}
                onChange={e => setDraft({ mainStack: e.target.value })}
                placeholder="Go, Node, Next, etc."
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Banco de dados</label>
              <input
                value={draft.databaseType}
                onChange={e => setDraft({ databaseType: e.target.value })}
                placeholder="PostgreSQL, MySQL, etc."
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Arquitetura</label>
              <select
                value={draft.architecture}
                onChange={e => setDraft({ architecture: e.target.value as any })}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                <option value="MONOLITH">Monolito</option>
                <option value="MICROSERVICES">Microserviços</option>
                <option value="EVENT_DRIVEN">Event-driven</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Cloud provider</label>
              <input
                value={draft.cloudProvider}
                onChange={e => setDraft({ cloudProvider: e.target.value })}
                placeholder="AWS, GCP, etc."
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Repositório git</label>
            <input
              value={draft.repositoryUrl}
              onChange={e => setDraft({ repositoryUrl: e.target.value })}
              placeholder="https://github.com/org/repo"
              className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Integrações externas</label>
            <textarea
              value={draft.externalIntegrations}
              onChange={e => setDraft({ externalIntegrations: e.target.value })}
              rows={4}
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Ambiente de deploy</label>
            <input
              value={draft.deployEnvironment}
              onChange={e => setDraft({ deployEnvironment: e.target.value })}
              placeholder="dev/staging/prod, cluster, etc."
              className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Data início *</label>
              <input
                type="date"
                value={draft.startDate}
                onChange={e => setDraft({ startDate: e.target.value })}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Data previsão término</label>
              <input
                type="date"
                value={draft.estimatedEndDate}
                onChange={e => setDraft({ estimatedEndDate: e.target.value })}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Data real término</label>
              <input
                type="date"
                value={draft.actualEndDate}
                onChange={e => setDraft({ actualEndDate: e.target.value })}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Prioridade</label>
              <select
                value={draft.priority}
                onChange={e => setDraft({ priority: e.target.value as any })}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Horas estimadas</label>
              <input
                value={draft.estimatedHours}
                onChange={e => setDraft({ estimatedHours: e.target.value })}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Horas realizadas</label>
              <input
                value={draft.actualHours}
                onChange={e => setDraft({ actualHours: e.target.value })}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Complexidade (1–5)</label>
              <select
                value={draft.complexity}
                onChange={e => setDraft({ complexity: e.target.value as any })}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Risco</label>
            <select
              value={draft.riskLevel}
              onChange={e => setDraft({ riskLevel: e.target.value as any })}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">—</option>
              <option value="LOW">Baixo</option>
              <option value="MEDIUM">Médio</option>
              <option value="HIGH">Alto</option>
            </select>
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select
                value={draft.status}
                onChange={e => setDraft({ status: e.target.value as any })}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                <option value="BACKLOG">Backlog</option>
                <option value="PLANNING">Em Planejamento</option>
                <option value="EXECUTION">Em Execução</option>
                <option value="HOMOLOGATION">Em Homologação</option>
                <option value="PRODUCTION">Produção</option>
                <option value="FINISHED">Finalizado</option>
                <option value="CANCELED">Cancelado</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Health Status</label>
              <select
                value={draft.health}
                onChange={e => setDraft({ health: e.target.value as any })}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">—</option>
                <option value="GREEN">Verde</option>
                <option value="YELLOW">Amarelo</option>
                <option value="RED">Vermelho</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Orçamento estimado</label>
              <input
                value={draft.estimatedBudget}
                onChange={e => setDraft({ estimatedBudget: e.target.value })}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Custo atual</label>
              <input
                value={draft.actualCost}
                onChange={e => setDraft({ actualCost: e.target.value })}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Margem prevista</label>
              <input
                value={draft.expectedMargin}
                onChange={e => setDraft({ expectedMargin: e.target.value })}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Margem real</label>
              <input
                value={draft.actualMargin}
                onChange={e => setDraft({ actualMargin: e.target.value })}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      ) : null}

      {step === 6 ? (
        <div className="grid gap-4">
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={draft.allowMultipleTeams}
              onChange={e => setDraft({ allowMultipleTeams: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            Permitir múltiplos times?
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={draft.allowMultipleBoards}
              onChange={e => setDraft({ allowMultipleBoards: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            Permitir múltiplos boards?
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={draft.financialControl}
              onChange={e => setDraft({ financialControl: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            Permitir controle financeiro?
          </label>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Visibilidade</label>
            <select
              value={draft.visibility}
              onChange={e => setDraft({ visibility: e.target.value as any })}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">—</option>
              <option value="PRIVATE">Privado</option>
              <option value="ORGANIZATION">Organização</option>
              <option value="PUBLIC">Público</option>
            </select>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" className="rounded-xl bg-card" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" className="rounded-xl bg-card" onClick={back} disabled={step === 1 || submitting}>
            Voltar
          </Button>
          {step < 6 ? (
            <Button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={validateAndNext} disabled={submitting}>
              Próximo
            </Button>
          ) : (
            <Button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={submit} disabled={submitting}>
              {submitting ? "Salvando…" : "Salvar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
