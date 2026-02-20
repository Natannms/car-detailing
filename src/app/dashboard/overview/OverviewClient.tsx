"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Buildings,
  Calendar,
  CreditCard,
  Stethoscope,
  UsersThree,
} from "@phosphor-icons/react";
import { ChartByDay } from "./ChartByDay";
import { ChartByWorkflowStatus } from "./ChartByWorkflowStatus";

type KPIs = {
  totalPatients: number;
  totalDoctors: number;
  totalUnits: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
};

type ByWorkflow = { workflowStatus: string; count: number }[];
type ByDay = { date: string; count: number }[];
type UpcomingItem = {
  id: string;
  patientName: string;
  doctorName: string;
  scheduledAt: string;
  unitName: string | null;
};
type Billing = { status: string; validUntil: string | null; planId: string | null } | null;

type Stats = {
  kpis: KPIs;
  appointmentsByWorkflowStatus: ByWorkflow;
  appointmentsByDay: ByDay;
  upcomingAppointments: UpcomingItem[];
  billing: Billing;
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function OverviewClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/overview/stats", { credentials: "same-origin" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error?.message ?? `Erro ${res.status}`);
        }
        const data: Stats = await res.json();
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro ao carregar dados");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6">
        <div>
          <div className="h-8 w-48 rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-72 rounded bg-muted" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="mt-3 h-8 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
            <div className="h-5 w-48 rounded bg-muted" />
            <div className="mt-4 h-[260px] rounded bg-muted" />
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
            <div className="h-5 w-48 rounded bg-muted" />
            <div className="mt-4 h-[260px] rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
        <p className="text-sm font-medium text-foreground">{error}</p>
        <button
          type="button"
          className="mt-3 text-sm text-primary underline hover:no-underline"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const { kpis, appointmentsByWorkflowStatus, appointmentsByDay, upcomingAppointments, billing } = stats;

  const kpiCards = [
    {
      label: "Pacientes",
      value: kpis.totalPatients,
      icon: UsersThree,
      href: "/dashboard/patients",
    },
    {
      label: "Médicos",
      value: kpis.totalDoctors,
      icon: Stethoscope,
      href: "/dashboard/doctors",
    },
    {
      label: "Unidades",
      value: kpis.totalUnits,
      icon: Buildings,
      href: "/dashboard/units",
    },
    {
      label: "Agendamentos (esta semana)",
      value: kpis.appointmentsThisWeek,
      sub: kpis.appointmentsToday > 0 ? `${kpis.appointmentsToday} hoje` : null,
      icon: Calendar,
      href: "/dashboard/appointments",
    },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Visão geral</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resumo da sua organização: pacientes, médicos, unidades e agendamentos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(({ label, value, sub, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border transition hover:ring-primary/50"
            aria-label={`${label}: ${value}. Ir para ${label.toLowerCase()}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <span className="rounded-lg bg-muted p-2 text-muted-foreground">
                <Icon size={20} weight="bold" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
            {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <h2 className="text-sm font-semibold text-foreground">Agendamentos por status</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Quantidade por etapa do fluxo</p>
          {appointmentsByWorkflowStatus.length > 0 ? (
            <div className="mt-4">
              <ChartByWorkflowStatus data={appointmentsByWorkflowStatus} />
            </div>
          ) : (
            <p className="mt-8 text-center text-sm text-muted-foreground">Nenhum agendamento ainda</p>
          )}
        </section>

        <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <h2 className="text-sm font-semibold text-foreground">Agendamentos por dia</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Últimos 14 dias</p>
          {appointmentsByDay.some(d => d.count > 0) ? (
            <div className="mt-4">
              <ChartByDay data={appointmentsByDay} />
            </div>
          ) : (
            <p className="mt-8 text-center text-sm text-muted-foreground">Nenhum dado no período</p>
          )}
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Próximos agendamentos</h2>
            <Link
              href="/dashboard/appointments"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver todos
            </Link>
          </div>
          {upcomingAppointments.length > 0 ? (
            <ul className="mt-4 space-y-3" role="list">
              {upcomingAppointments.map(a => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">{a.patientName}</span>
                  <span className="text-muted-foreground">{a.doctorName}</span>
                  <span className="w-full text-xs text-muted-foreground">
                    {formatDateTime(a.scheduledAt)}
                    {a.unitName ? ` · ${a.unitName}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-center text-sm text-muted-foreground">Nenhum agendamento futuro</p>
          )}
        </section>

        <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Assinatura</h2>
            <Link
              href="/dashboard/billing"
              className="text-xs font-medium text-primary hover:underline"
            >
              Gerenciar
            </Link>
          </div>
          {billing ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
              <CreditCard size={24} weight="bold" className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {billing.status === "ACTIVE" ? "Ativo" : billing.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  {billing.validUntil ? `Válido até ${formatDate(billing.validUntil)}` : "Sem data de validade"}
                  {billing.planId ? ` · Plano ${billing.planId}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-muted-foreground">Sem informação de assinatura</p>
          )}
        </section>
      </div>
    </div>
  );
}
