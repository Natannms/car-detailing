import Link from "next/link";
import { headers } from "next/headers";

function formatMoney(v: number | null) {
  if (v === null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function Home() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : "";
  const res = await fetch(`${origin}/api/plans`, { cache: "no-store" }).catch(() => null);
  const data = res ? await res.json().catch(() => null) : null;
  const plans: Array<{
    id: string;
    name: string;
    description: string;
    monthlyPrice: number | null;
    maxUnits: number | null;
    features: string[];
  }> = data?.plans ?? [];

  const byId = new Map(plans.map(p => [p.id, p]));
  const ordered = ["basic", "premium", "enterprise"].map(id => byId.get(id)).filter(Boolean) as any[];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-sm">
              <span className="text-sm font-semibold">MA</span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-900">MARCA AI</div>
              <div className="truncate text-xs text-gray-500">Atendimentos e agendamentos com IA</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center md:py-16">
          <div className="min-w-0">
            <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              Plataforma profissional para clínicas e operações locais
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
              MARCA AI: WhatsApp + Agendamentos com organização e controle
            </h1>
            <p className="mt-4 text-base text-gray-600 md:text-lg">
              Centralize atendimentos pelo WhatsApp, organize reservas e consultas, e mantenha o time alinhado com visibilidade total do fluxo.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Começar agora
              </Link>
              <Link
                href="#planos"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Ver planos
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-gradient-to-b from-indigo-50 to-white p-6 shadow-sm">
            <div className="grid gap-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Atendimentos</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">Kanban de conversas com bot e humano</div>
                <div className="mt-1 text-sm text-gray-600">Bot → Transferência → Em atendimento → Finalizado</div>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Agendamentos</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">Fila por horário e controle de fluxo</div>
                <div className="mt-1 text-sm text-gray-600">Respeita hora/dia e libera o próximo atendimento automaticamente</div>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Equipe</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">Roles e segurança por organização</div>
                <div className="mt-1 text-sm text-gray-600">Acesso protegido por assinatura e permissões</div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-gray-50">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <div className="text-sm font-semibold text-gray-900">Atendimento híbrido</div>
                <div className="mt-2 text-sm text-gray-600">IA atende o básico e transfere para humano quando necessário.</div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <div className="text-sm font-semibold text-gray-900">Controle operacional</div>
                <div className="mt-2 text-sm text-gray-600">Organize a rotina com agendamentos, pacientes e visibilidade do fluxo.</div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <div className="text-sm font-semibold text-gray-900">Escala por unidades</div>
                <div className="mt-2 text-sm text-gray-600">Expanda com múltiplas unidades conforme seu plano.</div>
              </div>
            </div>
          </div>
        </section>

        <section id="planos" className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Planos</div>
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Escolha o plano ideal</h2>
            <p className="text-sm text-gray-600">Os planos são carregados do banco e refletem o que está configurado no sistema.</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {ordered.map((p: any) => (
              <div
                key={p.id}
                className={[
                  "rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5",
                  p.id === "premium" ? "border border-indigo-200" : "border border-gray-100",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">{p.name}</div>
                    <div className="mt-1 text-sm text-gray-600">{p.description}</div>
                  </div>
                  {p.id === "premium" ? (
                    <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">Recomendado</span>
                  ) : null}
                </div>

                <div className="mt-6">
                  <div className="text-3xl font-semibold tracking-tight text-gray-900">{formatMoney(p.monthlyPrice)}</div>
                  <div className="mt-1 text-sm text-gray-500">por mês</div>
                </div>

                <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  {p.id === "basic" ? "1 unidade" : p.id === "premium" ? "Até 6 unidades" : "Falar com consultor"}
                </div>

                <ul className="mt-5 grid gap-2 text-sm text-gray-700">
                  {(p.features ?? []).slice(0, 6).map((f: string) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                      <span className="min-w-0">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {p.id === "enterprise" ? (
                    <Link
                      href="/register"
                      className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Falar com consultor
                    </Link>
                  ) : (
                    <Link
                      href="/register"
                      className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                      Criar conta
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-gray-500">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} MARCA AI</div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hover:text-gray-700">
                Login
              </Link>
              <Link href="/register" className="hover:text-gray-700">
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
