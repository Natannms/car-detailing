## Decisões confirmadas
- Client será model/tabela no Prisma.
- Tela “Projetos” será Table View (igual referência).

## Objetivo
- Redesenhar a dashboard no estilo da referência (sidebar moderna + topbar + cards), mantendo opções do menu e adicionando “Projetos”.
- Criar `/dashboard/projects` com lista de projetos, modal de detalhes e modal de criação com Step Form (6 steps).
- Evoluir Prisma/API para Project robusto e multi-tenant, incluindo model Client.

## 1) UI: Dashboard no estilo da referência
- Atualizar `src/app/dashboard/layout.tsx` para um layout moderno (sidebar fixa + topbar + main).
- Atualizar `src/app/dashboard/sideMenu.tsx`:
  - Manter: Conta, Billing (em breve), Logout.
  - Adicionar: Projetos → `/dashboard/projects`.
- Ajustar estilos (preferência por Tailwind no JSX, reduzindo CSS module onde fizer sentido).

## 2) UI: Página /dashboard/projects (Table View)
- Criar `src/app/dashboard/projects/page.tsx`:
  - Tabela com colunas principais: Nome, Código, Cliente, Status, Health, Metodologia, Início.
  - Busca e filtros básicos (opcional na 1ª entrega).
  - Clique na linha abre modal de Detalhes.
  - Botão “Create” abre modal de criação.

## 3) Modais
- Implementar um modal acessível simples (overlay + ESC + foco) sem dependência extra.
- Modal “Detalhes do Projeto”:
  - Chama `GET /api/projects/:id`.
  - Mostra dados completos (organizado por seções: Básico, Negócio, Técnicos, Datas, Controle).
- Modal “Cadastrar Projeto”:
  - Stepper 6 passos conforme sua divisão.
  - Botões: Voltar / Próximo / Salvar.

## 4) Step Form (6 steps) + Zustand
- Criar store Zustand para:
  - Draft do projeto (todos campos)
  - Step atual
  - Ações: setField, next, back, reset
- Validação por step com Zod:
  - Step 1 valida: name*, code*, clientId?, type, methodology, summary*.
  - Step 4 valida: startDate*.

## 5) Prisma: modelagem robusta (Project + Client + enums)
- Atualizar `prisma/schema.prisma`:
  - Criar `model Client` multi-tenant:
    - `id`, `organizationId`, `name`, `code?`, timestamps
    - `@@unique([organizationId, name])`
  - Expandir `model Project` para o modelo robusto (campos/enums que você listou) e relação opcional com `Client`.
  - Criar enums: ProjectType, Methodology, ProjectStatus, HealthStatus, BillingModel, ArchitectureType, PriorityLevel, RiskLevel, VisibilityLevel.
  - Manter multi-tenant via `organizationId`.
- Executar migração/atualização do Prisma uma única vez após a mudança do schema.

## 6) Backend/API
- Expandir Projects API existente:
  - `GET /api/projects` → lista resumida (inclui `client` quando existir)
  - `GET /api/projects/:id` → detalhe completo
  - `POST /api/projects` → cria com payload completo
- Adicionar Clients API:
  - `GET /api/clients` → lista (para select do Step 1)
  - `POST /api/clients` → cria (opcional: criar cliente rápido no modal)
- Garantir: organizationId vem sempre do AuthContext (Clerk), nunca do body.

## 7) Navegação
- Fazer `/projects` redirecionar para `/dashboard/projects` para evitar duplicidade.

## 8) Validação
- Validar fluxo em dev:
  - login → dashboard → projetos → abrir detalhe → criar projeto via Step Form → ver na tabela.
- Adicionar/ajustar testes unitários:
  - ProjectService: validações, multi-tenant, unique code.

## Ordem de implementação
1) Dashboard UI + menu com “Projetos”
2) /dashboard/projects UI (tabela + modal detalhe)
3) Prisma (Client+Project robusto) + repositórios/serviços
4) API endpoints
5) Modal de criação com Step Form (Zustand + Zod) integrado ao POST

Se você aprovar este plano, eu saio do modo de plano e começo a implementação completa.