"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type Plan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number | null;
  maxUnits: number | null;
  features: string[];
};

function formatMoney(v: number | null) {
  if (v === null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PlansFold() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plans", { cache: "no-store" })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erro ${res.status} ao carregar planos`);
        }
        return res.json();
      })
      .then((data: { plans?: Plan[] }) => {
        const list = Array.isArray(data?.plans) ? data.plans : [];
        setPlans(list.sort((a, b) => (a.monthlyPrice ?? 0) - (b.monthlyPrice ?? 0)));
      })
      .catch(err => setError(err instanceof Error ? err.message : "Não foi possível carregar os planos."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="planos" className="border-t border-gray-100 bg-white px-4 py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-emerald-600">Planos</p>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Escolha seu plano e comece agora
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-4 w-48 animate-pulse rounded bg-gray-100" />
                <div className="mt-6 h-8 w-24 animate-pulse rounded bg-gray-200" />
                <div className="mt-4 h-12 w-full animate-pulse rounded-xl bg-gray-100" />
                <div className="mt-5 space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-4 w-full animate-pulse rounded bg-gray-100" />
                  ))}
                </div>
                <div className="mt-8 h-12 w-full animate-pulse rounded-xl bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="planos" className="border-t border-gray-100 bg-white px-4 py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Planos</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Escolha seu plano</h2>
          <p className="mt-4 text-red-600">{error}</p>
        </div>
      </section>
    );
  }

  if (plans.length === 0) {
    return (
      <section id="planos" className="border-t border-gray-100 bg-white px-4 py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Planos</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Escolha seu plano e comece agora</h2>
          <p className="mt-4 text-gray-600">Nenhum plano disponível no momento.</p>
          <p className="mt-2 text-sm text-gray-500">
            Execute <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">npm run firebase:seed:plans</code> para criar os planos no banco.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="planos" className="border-t border-gray-100 bg-white px-4 py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-emerald-600">Planos</p>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          Escolha seu plano e comece agora
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-gray-600">
          Clique no botão do plano desejado. Ao criar sua conta, o plano já estará selecionado para sua assinatura.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map(p => (
            <div
              key={p.id}
              className={[
                "flex flex-col rounded-2xl border bg-white p-6 shadow-md transition hover:shadow-lg",
                p.id === "premium" ? "border-emerald-200 ring-2 ring-emerald-100" : "border-gray-200",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-gray-900">{p.name}</div>
                  <div className="mt-1 text-sm text-gray-600">{p.description}</div>
                </div>
                {p.id === "premium" && (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Recomendado
                  </span>
                )}
              </div>
              <div className="mt-6">
                <span className="text-3xl font-bold tracking-tight text-gray-900">{formatMoney(p.monthlyPrice)}</span>
                <span className="ml-1 text-sm text-gray-500">/mês</span>
              </div>
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                {p.maxUnits == null ? "Sob consulta" : p.maxUnits === 1 ? "1 unidade" : `Até ${p.maxUnits} unidades`}
              </div>
              <ul className="mt-5 flex-1 space-y-3 text-sm text-gray-700">
                {(p.features ?? []).slice(0, 6).map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href={`/register?plan=${encodeURIComponent(p.id)}`}
                  className={
                    p.id === "enterprise"
                      ? "inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      : "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
                  }
                >
                  {p.id === "enterprise" ? "Falar com consultor" : "Criar conta com este plano"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
