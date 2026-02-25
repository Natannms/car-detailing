import Link from "next/link";
import { PlansFold } from "./PlansFold";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header minimalista: só logo e CTAs */}
      <header className="sticky top-0 z-10 border-b border-gray-100/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-gray-900 no-underline">
            <span className="text-lg font-bold tracking-tight">MARCA AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero – primeira dobra (estilo referência) */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/60 to-teal-50/80 px-4 pb-16 pt-12 md:pt-16">
          {/* Decoração: círculos suaves */}
          <div className="pointer-events-none absolute -left-20 -top-10 h-64 w-64 rounded-full border border-sky-200/60 bg-transparent" />
          <div className="pointer-events-none absolute left-20 top-20 h-32 w-32 rounded-full border border-sky-100/80 bg-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-emerald-100/70" />

          <div className="relative mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-2 md:items-center">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                Plataforma para clínicas
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
                Muito mais foco e direcionamento para sua operação.
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-gray-600">
                Preparatório ideal para quem quer centralizar atendimentos pelo WhatsApp, agendamentos e equipe desde o primeiro dia, com máxima clareza e controle.
              </p>
              <div className="mt-8">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
                >
                  Começar agora
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Imagem da primeira dobra (lado direito) */}
            <div className="relative flex justify-center md:justify-end">
              <img
                src="/img/primeira-dobra.png"
                alt=""
                className="h-auto w-full max-w-md object-contain object-center md:max-w-lg"
              />
            </div>
          </div>
        </section>

        {/* Segunda dobra: grid 2 colunas (md+) – esquerda: doutora + bolas verdes; direita: cards */}
        <section className="relative overflow-hidden border-t border-gray-100 bg-white px-4 py-12 sm:py-16 md:py-20">
          {/* Bolas verdes atrás da doutora (coluna esquerda em md+) */}
          <div
            className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-100/90 sm:-left-32 sm:h-96 sm:w-96 md:-left-40 md:h-[26rem] md:w-[26rem]"
            aria-hidden
          />
          <div className="pointer-events-none absolute left-12 top-24 h-48 w-48 rounded-full bg-emerald-50/80 sm:left-24 sm:top-32 md:left-20 md:top-24 md:h-56 md:w-56" aria-hidden />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 md:grid md:grid-cols-2 md:gap-12 md:items-center">
            {/* Coluna 1 (esquerda em md+): doutora (maior em relação ao box) */}
            <div className="relative flex min-h-[280px] justify-center sm:min-h-[340px] md:min-h-0 md:justify-start md:pl-0">
              <img
                src={"/img/doutora, segunda dobra.png".replace(/ /g, "%20")}
                alt="Profissional de saúde da MARCA AI"
                className="relative z-10 h-auto w-full max-w-[320px] object-contain object-bottom sm:max-w-[380px] md:max-w-[420px] lg:max-w-[480px]"
              />
            </div>

            {/* Coluna 2 (direita em md+): grid 3x3 de cards */}
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-4">
              {[
                { label: "ACESSO DIRETO", title: "Atendimentos WhatsApp" },
                { label: "ACESSO DIRETO", title: "Agendamentos e fila" },
                { label: "ACESSO ÚNICO", title: "Pacientes e prontuário" },
                { label: "ACESSO DIRETO", title: "Kanban de atendimento" },
                { label: "ACESSO ÚNICO", title: "Múltiplas unidades" },
                { label: "ACESSO DIRETO", title: "Equipe e permissões" },
                { label: "ACESSO DIRETO", title: "Notificações e lembretes" },
                { label: "ACESSO ÚNICO", title: "Relatórios e visão geral" },
                { label: "ACESSO DIRETO", title: "Integração e API" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex min-w-0 flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] sm:p-5"
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 sm:text-xs">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-snug text-gray-900 sm:text-base">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Terceira dobra: depoimentos */}
        <section className="border-t border-gray-100 bg-gray-100 px-4 py-14 md:py-16">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              Siga o mesmo rumo de milhares de clínicas
            </h2>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  text: "Centralizar atendimentos pelo WhatsApp e agendamentos em um só lugar mudou nosso dia a dia. A equipe passou a enxergar a fila e o kanban ficou claro para todo mundo.",
                  name: "Carla Mendes",
                  role: "Coordenadora de atendimento",
                },
                {
                  text: "A aprovação da gestão veio quando viu que não perdemos mais mensagem e que os horários são respeitados. O MARCA AI trouxe organização e visibilidade que não tínhamos antes.",
                  name: "Ricardo Souza",
                  role: "Gestor de operações",
                },
                {
                  text: "Sonhos e objetivos exigem ferramentas que acompanhem o crescimento. Conseguimos escalar para várias unidades sem perder o controle. Recomendo para quem quer profissionalizar o atendimento.",
                  name: "Fernanda Lima",
                  role: "Diretora clínica",
                },
                {
                  text: "O MARCA AI transformou a forma como nossa clínica atende. Uniu WhatsApp, agendamentos e equipe em uma plataforma só. Flexível e fácil de usar no dia a dia.",
                  name: "Patricia Oliveira",
                  role: "Administradora",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-0.5" aria-hidden>
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg key={star} className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-700">{t.text}</p>
                  <p className="mt-4 font-semibold text-emerald-600">{t.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{t.role}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-center gap-2" aria-hidden>
              <span className="h-1 w-8 rounded-full bg-emerald-500" />
              <span className="h-1 w-4 rounded-full bg-gray-300" />
              <span className="h-1 w-4 rounded-full bg-gray-300" />
            </div>
          </div>
        </section>

        {/* Dobra: Planos – lista do banco via GET /api/plans */}
        <PlansFold />
      </main>

      <footer className="border-t border-gray-100 bg-white px-4 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">© {new Date().getFullYear()} MARCA AI</div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/login" className="text-gray-500 hover:text-gray-900">Entrar</Link>
            <Link href="/register" className="text-gray-500 hover:text-gray-900">Criar conta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
