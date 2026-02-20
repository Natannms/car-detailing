"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/app/ui/apiClient";
import { useSseSnapshot } from "@/app/ui/useSseSnapshot";
import { Button } from "@/components/ui/button";
import { CreditCard, Lightning, PixLogo, Receipt } from "@phosphor-icons/react";

type Billing = {
  organizationId: string;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  planId?: string | null;
  billingType: "PIX" | "CREDIT_CARD" | null;
  status: "PENDING" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  validUntil: string | null;
  currentPaymentId: string | null;
  currentInvoiceUrl: string | null;
};

type Plan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number | null;
  maxUnits: number | null;
};

type Payment = {
  paymentId: string;
  status: string;
  value: number | null;
  dueDate: string | null;
  invoiceUrl: string | null;
  billingType: string | null;
};

function formatMoney(v: number | null) {
  if (v === null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function statusLabel(s: Billing["status"]) {
  if (s === "ACTIVE") return "Ativa";
  if (s === "PAST_DUE") return "Inadimplente";
  if (s === "CANCELED") return "Cancelada";
  return "Pendente";
}

function statusClasses(s: Billing["status"]) {
  if (s === "ACTIVE") return "bg-emerald-100 text-emerald-700";
  if (s === "PAST_DUE") return "bg-red-100 text-red-700";
  if (s === "CANCELED") return "bg-muted text-muted-foreground";
  return "bg-amber-100 text-amber-800";
}

export function BillingClient() {
  const { data: snap, connected } = useSseSnapshot<{ billing: Billing | null }>("/api/stream/billing");
  const billing = snap?.billing ?? null;
  const billingLoading = !connected;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState("basic");
  const [billingType, setBillingType] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");

  const canPay = useMemo(() => Boolean(billing?.asaasSubscriptionId), [billing?.asaasSubscriptionId]);
  const invoiceUrl = billing?.currentInvoiceUrl ?? null;
  const isActive = billing?.status === "ACTIVE";

  useEffect(() => {
    const run = async () => {
      try {
        const me = await apiFetch<{ user: { email: string } }>("/api/auth/me");
        setEmail(me.user.email);
      } catch {
        setEmail("");
      }
    };
    void run();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const r = await apiFetch<{ plans: Plan[] }>("/api/plans");
        setPlans(r.plans ?? []);
      } catch {
        setPlans([]);
      }
    };
    void run();
  }, []);

  const loadPayments = async () => {
    setError(null);
    setLoadingPayments(true);
    try {
      const r = await apiFetch<{ payments: Payment[] }>("/api/billing/payments");
      setPayments(r.payments);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao carregar pagamentos.");
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const setup = async () => {
    setError(null);
    const n = name.trim();
    if (!n) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      const r = await apiFetch<{ invoiceUrl: string | null }>("/api/billing/setup", {
        method: "POST",
        json: {
          planId,
          billingType,
          customer: {
            name: n,
            email: email.trim() ? email.trim() : null,
            phone: phone.trim() ? phone.trim() : null,
            mobilePhone: phone.trim() ? phone.trim() : null,
            cpfCnpj: cpfCnpj.trim() ? cpfCnpj.trim() : null,
          },
        },
      });
      await loadPayments();
      if (r.invoiceUrl) window.open(r.invoiceUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao iniciar assinatura.");
    } finally {
      setSaving(false);
    }
  };

  const openInvoice = async () => {
    setError(null);
    setSaving(true);
    try {
      const r = await apiFetch<{ invoiceUrl: string | null }>("/api/billing/invoice", { method: "POST" });
      await loadPayments();
      if (r.invoiceUrl) window.open(r.invoiceUrl, "_blank", "noopener,noreferrer");
      else setError("Link de pagamento indisponível.");
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao gerar link de pagamento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie sua assinatura, pagamentos e acesso ao sistema.</p>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {billingLoading ? (
        <section className="grid gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <div className="flex items-center justify-between gap-4">
            <div className="h-5 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="h-16 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-16 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-12 w-32 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        </section>
      ) : null}

      {!billingLoading ? (
        <>
      <section className="grid gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-foreground">Status</div>
          <span className={["rounded-full px-2 py-1 text-xs font-semibold", statusClasses(billing?.status ?? "PENDING")].join(" ")}>
            {statusLabel(billing?.status ?? "PENDING")}
          </span>
        </div>
        <div className="grid gap-2 text-sm text-foreground md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-muted px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Validade</div>
            <div className="mt-1 font-semibold text-foreground">{billing?.validUntil ? formatDate(billing.validUntil) : "—"}</div>
          </div>
          <div className="rounded-2xl border border-border bg-muted px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forma de pagamento</div>
            <div className="mt-1 font-semibold text-foreground">{billing?.billingType ?? "—"}</div>
          </div>
        </div>

        {invoiceUrl ? (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            Existe uma cobrança pendente para pagamento.
          </div>
        ) : null}

        <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-end">
          <Button variant="outline" className="rounded-xl bg-card" onClick={() => void loadPayments()} disabled={loadingPayments || saving}>
            <Receipt weight="bold" />
            {loadingPayments ? "Atualizando…" : "Atualizar histórico"}
          </Button>
          {!isActive ? (
            <Button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => void openInvoice()} disabled={!canPay || saving}>
              <Lightning weight="bold" />
              {saving ? "Gerando…" : "Abrir link de pagamento"}
            </Button>
          ) : null}
        </div>
      </section>

      {!billing?.asaasSubscriptionId ? (
        <section className="grid gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <div className="text-sm font-semibold text-foreground">Criar assinatura</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Nome *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
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
              <label className="text-sm font-medium text-foreground">CPF/CNPJ</label>
              <input
                value={cpfCnpj}
                onChange={e => setCpfCnpj(e.target.value)}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Plano</label>
            <select
              value={planId}
              onChange={e => setPlanId(e.target.value)}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {(plans.length ? plans : [{ id: "basic", name: "Basic", monthlyPrice: 21.9 } as any, { id: "premium", name: "Premium", monthlyPrice: 31.9 } as any, { id: "enterprise", name: "Enterprise", monthlyPrice: 99.9 } as any]).map(
                (p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} • {typeof p.monthlyPrice === "number" ? formatMoney(p.monthlyPrice) : "—"}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="grid gap-3 rounded-2xl border border-border bg-muted px-4 py-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forma de pagamento</div>
            <div className="grid gap-2 md:grid-cols-2">
              <button
                type="button"
                className={[
                  "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold",
                  billingType === "PIX" ? "border-primary bg-card text-foreground" : "border-border bg-card text-muted-foreground",
                ].join(" ")}
                onClick={() => setBillingType("PIX")}
              >
                <span className="flex items-center gap-2">
                  <PixLogo weight="bold" />
                  Pix
                </span>
                {billingType === "PIX" ? <span className="text-xs font-semibold text-indigo-600">Selecionado</span> : null}
              </button>

              <button
                type="button"
                className={[
                  "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold",
                  billingType === "CREDIT_CARD" ? "border-primary bg-card text-foreground" : "border-border bg-card text-muted-foreground",
                ].join(" ")}
                onClick={() => setBillingType("CREDIT_CARD")}
              >
                <span className="flex items-center gap-2">
                  <CreditCard weight="bold" />
                  Cartão
                </span>
                {billingType === "CREDIT_CARD" ? <span className="text-xs font-semibold text-indigo-600">Selecionado</span> : null}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => void setup()} disabled={saving}>
              <Lightning weight="bold" />
              {saving ? "Criando…" : "Criar e pagar agora"}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
        <div className="text-sm font-semibold text-foreground">Histórico de pagamentos</div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Forma</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                    Nenhum pagamento ainda.
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.paymentId} className="bg-card">
                    <td className="px-4 py-4 text-foreground">{formatDate(p.dueDate)}</td>
                    <td className="px-4 py-4 font-semibold text-foreground">{formatMoney(p.value)}</td>
                    <td className="px-4 py-4 text-foreground">{p.billingType ?? "—"}</td>
                    <td className="px-4 py-4 text-foreground">{p.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
        </>
      ) : null}
    </div>
  );
}
