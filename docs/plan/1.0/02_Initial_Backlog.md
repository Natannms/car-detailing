# BACKLOG INICIAL - VERSÃO 1.0 (MVP)

## 📌 Escopo
Este backlog cobre a fundação arquitetural, a segurança básica, e o core de gestão de Épicos e Histórias, além da funcionalidade chave de importação via Markdown.

---

## 🟣 EPIC 1: [Infraestrutura] - Estabelecer fundação segura e auditável

### 🟢 STORY 1.1: Autenticação Segura via Token
**Eu como** Cliente da API (Sistema ou Agente)
**Quero** me autenticar via Token JWT
**Para** acessar os recursos do meu projeto com segurança

**Critérios de Aceite (BDD):**
- **Dado que** possuo credenciais válidas, **Quando** solicito um token de acesso, **Então** devo receber um JWT assinado contendo meu ID de organização.
- **Dado que** tento acessar `/api/epics` sem token, **Quando** executo a requisição, **Então** devo receber status `401 Unauthorized`.

#### 🔵 TASKS
- [ ] **Implementar Provedor de JWT** (Configurar lib `jose`/`jsonwebtoken`, criar serviço de assinatura).
- [ ] **Criar Middleware de Proteção de Rotas** (Validar header `Authorization`, injetar contexto do usuário).

### 🟢 STORY 1.2: Estrutura de Banco de Dados Multi-tenant
**Eu como** Administrador do Sistema
**Quero** que os dados sejam isolados por projeto/organização
**Para** garantir a privacidade e segurança dos clientes

**Critérios de Aceite (BDD):**
- **Dado que** sou da Organização A, **Quando** listo Épicos, **Então** não devo ver Épicos da Organização B.

#### 🔵 TASKS
- [ ] **Configurar Prisma e Postgres** (Instalar Prisma, Configurar Schema `schema.prisma`).
- [ ] **Criar Migrations Iniciais** (Definir models: Projects, Epics, Stories, Users).
- [ ] **Implementar Prisma Client Singleton** (Evitar múltiplas instâncias em dev).

---

## 🟣 EPIC 2: [Gestão] - Gestão Centralizada de Demandas

### 🟢 STORY 2.1: Gestão de Épicos de Projeto
**Eu como** Gerente de Produto
**Quero** criar e manter Épicos
**Para** agrupar histórias relacionadas a um grande objetivo de negócio

**Critérios de Aceite (BDD):**
- **Dado que** tenho um Projeto ID válido, **Quando** envio POST para `/api/epics` com título único, **Então** o sistema cria o Épico.
- **Dado que** tento criar Épico duplicado, **Quando** envio requisição, **Então** recebo `409 Conflict`.

#### 🔵 TASKS
- [ ] **Criar Repositório de Épicos (Port + Adapter)** (Interface de Domínio + Implementação Prisma).
- [ ] **Implementar Endpoint CRUD de Épicos** (Routes Next.js, Validação Zod).

### 🟢 STORY 2.2: Gestão de Histórias de Usuário
**Eu como** Product Owner
**Quero** detalhar Épicos em Histórias menores
**Para** que o time possa desenvolver incrementos de valor

**Critérios de Aceite (BDD):**
- **Dado que** tenho um Épico existente, **Quando** crio uma História vinculada a ele, **Então** ela é persistida corretamente.

#### 🔵 TASKS
- [ ] **Criar Repositório de Histórias** (CRUD básico com Prisma, busca por EpicID).
- [ ] **Implementar Regra de Associação** (Garantir que EpicID existe antes de criar Story).

---

## 🟣 EPIC 3: [Integração] - Importação Automatizada de Backlogs

### 🟢 STORY 3.1: Ingestão de Backlog via Markdown
**Eu como** Agente de IA / Usuário Avançado
**Quero** enviar um arquivo Markdown contendo o planejamento
**Para** que o sistema crie automaticamente todos os Épicos, Histórias e Tarefas

**Critérios de Aceite (BDD):**
- **Dado que** tenho um markdown com hierarquia (H1, H2, H3), **Quando** envio para `/api/backlog-parser/import`, **Então** o sistema cria a árvore de itens no banco.
- **Dado que** reenvio o mesmo markdown, **Então** o sistema não duplica os itens (Idempotência).

#### 🔵 TASKS
- [ ] **Implementar Lógica de Parsing Hierárquico** (Ler Markdown, identificar Épicos e Stories).
- [ ] **Implementar Estratégia de Upsert** (Verificar existência por Título + Projeto antes de criar).
- [ ] **Criar Endpoint de Importação** (`POST /api/backlog-parser/import`).

---

## 🟣 EPIC 4: [UI] - Telas Jira-like (MVP)

### 🟢 STORY 4.1: Sessão por Token (Login)
**Eu como** Usuário do sistema
**Quero** informar/gerar um token JWT de acesso
**Para** consumir a API protegida com segurança

**Critérios de Aceite (BDD):**
- **Dado que** eu informo um JWT válido, **Quando** salvo a sessão, **Então** o app usa `Authorization: Bearer <token>` em todas as chamadas.
- **Dado que** a API retornar `401`, **Quando** eu tentar acessar qualquer tela protegida, **Então** sou direcionado para `/login` com mensagem de sessão inválida.

#### 🔵 TASKS
- [ ] **Criar Tela /login** (Colar token e gerar token via bootstrap).
- [ ] **Criar Tela /settings/session** (Trocar/remover token e ver payload).

### 🟢 STORY 4.2: Gestão de Projetos (UI)
**Eu como** Usuário autenticado
**Quero** listar e criar projetos
**Para** definir o contexto do backlog que vou gerenciar

**Critérios de Aceite (BDD):**
- **Dado que** estou autenticado, **Quando** acesso `/projects`, **Então** vejo a lista vinda de `GET /api/projects`.
- **Dado que** preencho um nome válido, **Quando** crio um projeto, **Então** ele aparece na lista e posso acessá-lo.

#### 🔵 TASKS
- [ ] **Criar Tela /projects** (Listar/criar e persistir último projeto).

### 🟢 STORY 4.3: Backlog do Projeto (Épicos)
**Eu como** PO/PM
**Quero** ver e manter os épicos de um projeto
**Para** ter visão macro e organizar o backlog

**Critérios de Aceite (BDD):**
- **Dado que** estou em um projeto, **Quando** abro `/projects/:projectId/backlog`, **Então** vejo os épicos de `GET /api/epics?projectId=...`.
- **Dado que** crio um épico, **Quando** salvo, **Então** ele aparece na listagem.

#### 🔵 TASKS
- [ ] **Criar Tela /projects/:projectId/backlog** (Listar/criar épicos e navegação).

### 🟢 STORY 4.4: Detalhe do Épico (Stories)
**Eu como** PO
**Quero** ver o detalhe do épico e suas stories
**Para** detalhar o trabalho em incrementos menores

**Critérios de Aceite (BDD):**
- **Dado que** abro um épico, **Quando** a tela carrega, **Então** vejo detalhes via `GET /api/epics/:id` e stories via `GET /api/stories?epicId=...`.
- **Dado que** crio uma story, **Quando** salvo, **Então** ela aparece na lista do épico.

#### 🔵 TASKS
- [ ] **Criar Tela /projects/:projectId/epics/:epicId** (Detalhe + CRUD básico).

### 🟢 STORY 4.5: Detalhe da Story (Tasks)
**Eu como** Dev/QA
**Quero** ver a story e suas tasks
**Para** executar o trabalho com clareza

**Critérios de Aceite (BDD):**
- **Dado que** abro uma story, **Quando** a tela carrega, **Então** vejo detalhes via `GET /api/stories/:id` e tasks via `GET /api/tasks?storyId=...`.
- **Dado que** crio/edito/excluo uma task, **Quando** confirmo, **Então** a lista reflete as mudanças.

#### 🔵 TASKS
- [ ] **Criar Tela /projects/:projectId/stories/:storyId** (Detalhe + CRUD de tasks).

### 🟢 STORY 4.6: Importação via Markdown (UI)
**Eu como** Usuário avançado
**Quero** importar um backlog via Markdown por tela
**Para** acelerar a criação de épicos/stories/tasks

**Critérios de Aceite (BDD):**
- **Dado que** envio Markdown, **Quando** importo, **Então** vejo o relatório de created/ignored.
- **Dado que** reenvio o mesmo Markdown, **Quando** importo, **Então** não duplica itens (idempotência).

#### 🔵 TASKS
- [ ] **Criar Tela /projects/:projectId/import** (Editor + relatório e atalho para backlog).

---

## 🟣 EPIC 5: [Auth] - Autenticação completa e convites de membros (MVP+)

### 🟢 STORY 5.1: Registro de organização e usuário ORG_ADMIN
**Eu como** Usuário novo
**Quero** criar uma conta com email e senha e registrar minha organização
**Para** iniciar o uso do JiraLike como administrador

**Critérios de Aceite (BDD):**
- **Dado que** informo nome de organização, email e senha válidos, **Quando** envio o registro, **Então** uma organização é criada e meu usuário é criado com role `ORG_ADMIN`.
- **Dado que** o email já existe, **Quando** tento registrar novamente, **Então** recebo erro de conflito sem vazamento de detalhes sensíveis.

#### 🔵 TASKS
- [ ] **Atualizar schema Prisma** (email único, modelo de convite, relações).
- [ ] **Criar endpoint POST /api/auth/register** (set cookie HttpOnly com JWT).
- [ ] **Criar tela /register** (fluxo ORG_ADMIN).
- [ ] **Criar testes unitários** (register e validações).

### 🟢 STORY 5.2: Login por email e senha
**Eu como** Usuário cadastrado
**Quero** autenticar com email e senha
**Para** acessar meus projetos com segurança

**Critérios de Aceite (BDD):**
- **Dado que** informo credenciais válidas, **Quando** realizo login, **Então** recebo sessão ativa via cookie HttpOnly.
- **Dado que** informo credenciais inválidas, **Quando** realizo login, **Então** recebo mensagem genérica e status 401.

#### 🔵 TASKS
- [ ] **Criar endpoint POST /api/auth/login** (set cookie HttpOnly com JWT).
- [ ] **Criar endpoint POST /api/auth/logout** (limpar cookie).
- [ ] **Criar endpoint GET /api/auth/me** (retornar usuário logado).
- [ ] **Atualizar tela /login** (fluxo real).
- [ ] **Atualizar middleware** (aceitar cookie e Bearer).

### 🟢 STORY 5.3: Convidar membro por link (ORG_ADMIN)
**Eu como** ORG_ADMIN
**Quero** gerar um link de convite
**Para** que novos membros criem conta automaticamente vinculada à minha organização

**Critérios de Aceite (BDD):**
- **Dado que** sou ORG_ADMIN, **Quando** gero convite, **Então** um token é persistido no banco com expiração.
- **Dado que** o token expirou ou foi usado, **Quando** alguém tentar usar, **Então** o registro é bloqueado.

#### 🔵 TASKS
- [ ] **Criar model InviteToken no Prisma** (token hash, expiração, uso único).
- [ ] **Criar endpoint POST /api/invites** (criar convite e retornar link).
- [ ] **Criar endpoint GET /api/invites** (listar convites da organização).
- [ ] **Criar endpoint DELETE /api/invites/:id** (revogar convite).
- [ ] **Criar tela /settings/members** (botão “gerar link”, listar convites).

### 🟢 STORY 5.4: Registro via convite (MEMBER)
**Eu como** Convidado
**Quero** clicar no link de convite e registrar com email/senha
**Para** entrar automaticamente como MEMBER na organização que me convidou

**Critérios de Aceite (BDD):**
- **Dado que** o convite é válido, **Quando** completo o registro, **Então** minha conta é criada com role `MEMBER` e organizationId do convite.
- **Dado que** o convite é inválido/expirado/usado, **Quando** tento registrar, **Então** recebo erro e não é criada conta.

#### 🔵 TASKS
- [ ] **Criar endpoint GET /api/invites/token/:token/preview** (mostrar organização do convite).
- [ ] **Criar endpoint POST /api/invites/token/:token/redeem** (criar MEMBER e marcar convite como usado).
- [ ] **Atualizar tela /register** (modo convite via query param).
- [ ] **Criar testes unitários** (expiração, uso único, bloqueios).
