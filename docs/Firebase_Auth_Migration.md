# Migração: Clerk para Firebase Authentication

Este documento descreve a substituição do Clerk por Firebase Authentication no projeto, mantendo a arquitetura atual (Ports & Adapters, requireAuthContext, billing gate, sync por organização/unidade).

---

## 1. Contexto e motivação

- **Clerk** era usado em: middleware, layout (ClerkProvider), telas de login/registro (SignIn/SignUp), logout (SideMenu, AppShell, settings/session) e em todas as APIs via `requireAuthContext()` em `authClerk.ts`.
- **Objetivo:** trocar o provedor de identidade para Firebase Auth, com sessão segura em cookie HttpOnly (Firebase session cookie), sem alterar a arquitetura do sistema.

---

## 2. Rotas públicas (inalteradas)

| Rota | Descrição |
|------|-----------|
| `/` | Landing |
| `/login(.*)` | Login |
| `/register(.*)` | Registro |
| `/api/health` | Health check |
| `/api/invites/token/(.*)/preview` | Preview de convite |
| `/webhook/asaas` | Webhook Asaas |

Todas as demais exigem autenticação.

---

## 3. Arquitetura da autenticação com Firebase

### 3.1 Fluxo de login

1. Usuário informa email e senha na tela de login.
2. Cliente chama `signInWithEmailAndPassword` (Firebase Auth SDK).
3. Cliente obtém `user.getIdToken()` e envia `POST /api/auth/session` com `{ idToken }`.
4. Backend valida com `firebaseAdmin.auth().verifyIdToken(idToken)`, faz sync do usuário (authSync.sync), gera session cookie com `createSessionCookie`, responde com Set-Cookie HttpOnly.
5. Cliente redireciona para `/dashboard`.

### 3.2 Requisições autenticadas

- Browser envia o session cookie; cada API chama `requireAuthContext(request)` que verifica o cookie com `verifySessionCookie`, obtém uid/email, chama authSync.sync e retorna `{ auth, user }`.

### 3.3 Logout

- Cliente chama `signOut()` do Firebase e `POST /api/auth/logout`; backend limpa o cookie; redirect para `/login`.

---

## 4. Alterações por camada

- **Domínio:** User com `firebaseUid` em vez de `clerkUserId`; UserRepository com `findByFirebaseUid` / `attachFirebaseUid`.
- **FirebaseUserSyncService:** mesma lógica do ClerkUserSyncService, entrada `{ firebaseUid, email }`.
- **authFirebase.ts:** lê cookie `__session`, `verifySessionCookie`, authSync.sync, retorna auth/user.
- **POST /api/auth/session:** recebe idToken, verifyIdToken, sync, createSessionCookie, Set-Cookie.
- **POST /api/auth/logout:** limpa cookie.
- **Proxy:** em Next.js 16 usa-se apenas `src/proxy.ts` (não `middleware.ts`). Rotas públicas liberadas; demais exige cookie `__session` (redirect ou 401).
- **Frontend:** login/registro com Firebase Auth client; logout com signOut + POST /api/auth/logout; layout sem ClerkProvider.

---

## 5. Dependências e variáveis

- **Adicionar:** `firebase` (SDK client). **Remover:** `@clerk/nextjs`.
- **Firebase Admin:** já existente; usar `firebase-admin/auth` (verifyIdToken, createSessionCookie, verifySessionCookie).
- **Env:** remover CLERK_*; usar credenciais Firebase Admin; client: NEXT_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID.

---

## 6. Testes (CI/CD)

- Testes do FirebaseUserSyncService (criar por firebaseUid, attach por email, conflito, retorno existente).
- Ajustar inviteService.test e authService.test para firebaseUid.
- Threshold de cobertura em `jest.config.js` definido conforme cobertura atual; meta de 60% pode ser restaurada com mais testes.

---

## 7. Ordem de implementação

1. Documento (este arquivo)
2. Domínio: firebaseUid em User e repositórios
3. FirebaseUserSyncService + container + Firebase admin auth()
4. authFirebase.ts + POST session + POST logout
5. Middleware proxy.ts
6. Trocar authClerk por authFirebase em todas as rotas (passar request)
7. Telas login/registro + logout + layout sem Clerk
8. Testes e remoção do Clerk
