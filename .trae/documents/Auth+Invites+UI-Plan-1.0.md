## Objetivo
- Transformar o login “bootstrap” em um **sistema completo** com **Register + Login** usando PostgreSQL/Prisma.
- Garantir multi-tenant por `organizationId` e roles (`ORG_ADMIN`, `MEMBER`).
- Implementar **convite por link** com token persistido no banco (expira/uso único), que leva ao registro já associado à organização.
- Atualizar o backlog (docs) com EPIC/Stories/Tasks para essa entrega.

## Decisões de Segurança (obrigatórias)
- Não “ler”/expor `AUTH_BOOTSTRAP_KEY` e `JWT_SECRET` no client. Em Next.js, variáveis do `.env` **não podem ir para o browser** sem `NEXT_PUBLIC_` (e isso vazaria segredos).
- Substituir armazenamento de JWT em `localStorage` por **cookie HttpOnly** (cumpre o [Security_policy.md](file:///d:/PROJETOS/ghork/kanban-AI/docs/GUIDES/Security_policy.md)).
- Remover fallbacks hardcoded de secret em produção (ex.: `JWT_SECRET ?? "test-secret"`). O app deve falhar fast se `JWT_SECRET` ausente.
- Convite por link: token opaco, alta entropia, **expiração**, **uso único**, revogável; armazenar **hash do token** no banco (não o token puro) para reduzir impacto de vazamento.

## Mudanças no Modelo (Prisma)
- Ajustar `User` para ter `@@unique([email])` (ou manter por org, mas para login simples recomendo email único global) e adicionar campos de autenticação:
  - `email`, `passwordHash`, `roles` (já existe)
- Adicionar modelo `InviteToken`:
  - `id`, `organizationId`, `tokenHash`, `expiresAt`, `usedAt`, `createdByUserId`, `emailHint?` (opcional), `roleToGrant` (fixo MEMBER)
  - índices: `@@unique([tokenHash])`, `@@index([organizationId])`
- (Opcional) adicionar `Session` se quisermos refresh tokens; para MVP, cookie JWT de curto prazo pode ser suficiente.

## Serviços de Aplicação (Application)
- `AuthService`
  - `registerOwner(email, password, organizationName)` → cria Organization + User ORG_ADMIN
  - `login(email, password)` → valida credenciais e retorna claims
  - `hashPassword`, `verifyPassword` (com bcryptjs)
- `InviteService`
  - `createInvite(auth)` (somente ORG_ADMIN) → gera token aleatório, persiste hash + expiração
  - `redeemInvite(token, email, password)` → valida token, cria User MEMBER na org do convite, marca `usedAt`

## Endpoints (API Routes)
- Substituir/encerrar o endpoint `/api/auth/token` (bootstrap) para **apenas dev** ou remover.
- Criar:
  - `POST /api/auth/register` (owner) → seta cookie de sessão
  - `POST /api/auth/login` → seta cookie de sessão
  - `POST /api/auth/logout` → limpa cookie
  - `GET /api/auth/me` → retorna usuário/org/roles (para UI)
  - `POST /api/invites` (ORG_ADMIN) → retorna link
  - `GET /api/invites/:token/preview` (público) → retorna org name + validade (sem revelar token/hash)
  - `POST /api/invites/:token/redeem` (público) → cria conta MEMBER e seta cookie

## Middleware e Contexto de Auth
- Atualizar `middleware.ts` para aceitar:
  - `Authorization: Bearer ...` (para integração/agents)
  - OU cookie HttpOnly (para UI)
- Padronizar `getAuthFromHeaders` para ler claims derivadas do token verificado (não confiar em headers vindos do cliente).

## Telas (UI)
- `/login`
  - Trocar para formulário **email + senha** (login real).
  - Remover auto-preenchimento de segredos do `.env`.
  - Manter “bootstrap token” apenas se `NODE_ENV=development` e mesmo assim sem expor `AUTH_BOOTSTRAP_KEY` (server action / endpoint dev-only).
- `/register`
  - Modo A (sem convite): cria org + user ORG_ADMIN
  - Modo B (com `?invite=...`): mostra organização do convite e cria user MEMBER
- `/settings/members`
  - Botão “Gerar link de convite” → chama API e exibe link copiável
  - Lista de convites (ativos/usados/expirados) + revogar

## Backlog (Documentação)
- Atualizar [02_Initial_Backlog.md](file:///d:/PROJETOS/ghork/kanban-AI/docs/plan/1.0/02_Initial_Backlog.md) adicionando um novo EPIC:
  - **EPIC 5: [Auth] - Autenticação completa e convites de membros**
  - Stories com BDD:
    - Register ORG_ADMIN
    - Login
    - Logout/Me
    - Gerar convite (ORG_ADMIN)
    - Aceitar convite e registrar MEMBER
    - Tela Members + gestão de convites
  - Tasks técnicas por story (schema Prisma, services, routes, middleware, UI)

## Testes e Cobertura (CI/CD)
- Adicionar testes unitários para:
  - `AuthService` (hash/verify, register/login, bloqueios)
  - `InviteService` (expiração, uso único, cross-tenant, role)
  - Middleware parsing (token ausente/inválido)
- Manter coverage ≥ 60% e incluir novos diretórios relevantes.

## Passos de Migração
- Introduzir as novas rotas de auth em paralelo.
- Migrar UI para cookie (remover dependência de `localStorage`).
- Desativar bootstrap token (ou condicionar estritamente a dev) após login/register funcionando.

Se você aprovar este plano, eu implemento em sequência: schema Prisma + serviços + rotas + middleware + telas + testes + atualização do backlog.