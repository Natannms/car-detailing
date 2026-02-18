## Objetivo
- Substituir o login/sessão “caseiro” por **Clerk** (App Router) e centralizar identidade do usuário no ecossistema interno.
- Criar uma **página /login profissional** (layout semelhante à imagem: coluna esquerda visual/branding, coluna direita card de login) **sem Google**.
- Salvar no nosso Postgres o `clerkUserId` para associar e sincronizar usuários do Clerk com o nosso banco.

## Estado atual (impacto)
- Hoje o projeto usa JWT próprio + cookie `auth_token` e injeta `x-user-id/x-org-id/x-roles` no middleware: [middleware.ts](file:///d:/PROJETOS/ghork/kanban-AI/src/middleware.ts) e [auth.ts](file:///d:/PROJETOS/ghork/kanban-AI/src/app/api/_lib/auth.ts).
- Há uma tela de login simples baseada em `/api/auth/login`: [login/page.tsx](file:///d:/PROJETOS/ghork/kanban-AI/src/app/login/page.tsx).
- Já temos Tailwind + shadcn/ui configurados para construir uma UI de qualidade.

## Decisões de arquitetura
- **Clerk será a fonte de verdade da sessão** (cookies gerenciados pelo Clerk).
- Nosso backend continuará tendo a entidade `User` e `Organization`, mas com um novo campo `clerkUserId` (único). O usuário do Clerk será “espelhado” no nosso DB via **upsert**.
- Para não travar o uso em um único fluxo, o mapeamento será:
  - Se existir usuário por `clerkUserId` → usa.
  - Se não existir, mas existir por `email` → associa `clerkUserId` ao usuário existente.
  - Se não existir nenhum → cria novo usuário (e associa a uma organização padrão).

## Plano de implementação

## 1) Dependências e configuração do Clerk
- Adicionar `@clerk/nextjs`.
- Adicionar variáveis no `.env`:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - (opcional) `CLERK_SIGN_IN_URL=/login`, `CLERK_SIGN_UP_URL=/register`, `CLERK_AFTER_SIGN_IN_URL=/dashboard`, `CLERK_AFTER_SIGN_UP_URL=/dashboard`
- Configurar `ClerkProvider` no layout raiz (`src/app/layout.tsx`).

## 2) Middleware/Proxy do Clerk (App Router)
- Substituir o middleware atual (JWT próprio) por `clerkMiddleware()` conforme quickstart.
  - Criar `src/proxy.ts` (Next.js está migrando de middleware → proxy).
  - Proteger rotas privadas por matcher (ex.: `/dashboard(.*)`, `/projects(.*)`, `/settings(.*)`, APIs privadas `/api/(.*)` exceto health/preview do invite).
  - Manter públicas: `/login`, `/register`, `/api/health`.

## 3) Persistência do vínculo Clerk ↔ Nosso DB
- Atualizar Prisma:
  - `User.clerkUserId String? @unique`
  - `User.email` já existe (único).
- Atualizar adapters/repositórios:
  - `UserRepository.findByClerkUserId(clerkUserId)`
  - `UserRepository.attachClerkUserId(userId, clerkUserId)`
- Criar um serviço de sincronização (ex.: `ClerkUserSyncService` ou método no `AuthService`) que:
  - Recebe `clerkUserId`, `email` (e opcionalmente nome) vindo do Clerk.
  - Faz a regra de upsert/attach descrita acima.

## 4) AuthContext para as APIs usando Clerk
- Criar helper server-side (ex.: `src/app/api/_lib/authClerk.ts`) que:
  - Usa `auth()` do Clerk para obter `userId` (clerk) e validar sessão.
  - Faz sync do usuário no nosso DB (garante `internalUserId`).
  - Retorna `AuthContext` no formato atual do domínio (`userId`, `organizationId`, `roles`).
- Atualizar todas as rotas de API privadas para usarem esse helper em vez de `getAuthFromHeaders()`.

## 5) Organização padrão (para novos usuários)
- Criar estratégia de “org default” para o ecossistema interno:
  - Opção A (recomendada): variável `DEFAULT_ORGANIZATION_ID` ou `DEFAULT_ORGANIZATION_NAME`.
  - Se não existir, criar uma organização “Company” uma única vez.
  - Novos usuários entram como `MEMBER`.

## 6) Página /login profissional (sem Google)
- Implementar `/login` com layout em 2 colunas (semelhante à imagem):
  - Coluna esquerda: background/branding, texto curto, elementos decorativos.
  - Coluna direita: Card shadcn com título, subtítulo, e o componente de login do Clerk.
- Integração Clerk UI:
  - Usar `<SignIn />` embutido.
  - Customizar `appearance` para combinar com nosso tema/tokens.
  - Remover/hide social buttons via aparência.
  - Observação: para **não permitir Google de verdade**, desabilitar o provider no painel do Clerk (ou restringir “email/password only”).

## 7) Fluxos de logout e sessão
- Logout via Clerk (`signOut()` no client).
- Ajustar menu existente para chamar logout do Clerk.
- Garantir que rotas privadas redirecionem para `/login` quando a sessão expirar.

## 8) Limpeza/compatibilidade
- Deprecar/remover endpoints antigos:
  - `/api/auth/login`, `/api/auth/register` e JWT próprio (se não forem mais usados).
- Manter (ou recriar) um endpoint `/api/auth/me` que retorna nosso `User` interno associado ao Clerk.

## 9) Testes e validação
- Testes unitários para o serviço de sync:
  - cria usuário novo ao ver `clerkUserId` desconhecido
  - associa `clerkUserId` a usuário existente por email
  - rejeita cenários inconsistentes
- Verificar:
  - `npm run build`
  - `npm run test:coverage`

## Entregáveis
- Login page profissional com Clerk.
- Sessão e proteção de rotas via Clerk.
- Persistência de `clerkUserId` no Postgres e sync automático.
- APIs usando `AuthContext` derivado do Clerk.
- Ajustes de logout/menu.

Se você aprovar, eu implemento a integração completa (backend + UI + migração de auth) e deixo o projeto rodando com Clerk end-to-end.