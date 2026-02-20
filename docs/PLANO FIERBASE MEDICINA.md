# PLANO FIERBASE MEDICINA

Este documento consolida todas as decisões e requisitos já definidos para evoluir o projeto Marca AI para uma plataforma de **clínica/medicina**, migrando o banco (Prisma/Postgres) para **Firebase**, mantendo autenticação já pronta, e adicionando Kanban de atendimento, Pacientes, Agendamentos e Médicos (com convite por link e RBAC).

---

## 1) Estado atual (baseline)

- Autenticação: já existe e está funcionando.
- Arquitetura: camadas com `domain` + `application/services` + `adapters/repositories` + rotas `src/app/api/*`.
- Hoje: persistência via Prisma/Postgres (models/tabelas).
- Objetivo: migrar persistência para Firebase e remover dependência de ORM para operações do app.

---

## 2) Objetivo da migração para Firebase

### 2.1 O que muda
- O que era **tabela** no Prisma vira **collection** no Firebase.
- Repositórios/adapters deixam de usar Prisma e passam a usar a biblioteca do Firebase para CRUD.
- Rotas `/api/*` continuam existindo, mas passam a chamar repositórios Firebase.

### 2.2 O que não muda (neste plano)
- Autenticação continua como está.
- RBAC existente continua como base, com adição de role específica para **médico**.

---

## 3) Firebase: escolhas técnicas

### 3.1 Serviços Firebase necessários
- Firestore (banco principal)
- (Opcional) Cloud Functions para tarefas assíncronas e validações server-side
- (Opcional) Cloud Storage para anexos futuros (ex.: exames, imagens)

### 3.2 SDK a usar
- Backend (rotas Next): **Firebase Admin SDK** para acessar Firestore no servidor.
- Frontend: usar o app apenas via `/api/*` (recomendado) para centralizar RBAC e multi-tenant no backend.

### 3.3 Estrutura de configuração
- Criar `src/infrastructure/firebase/admin.ts` com inicialização do admin SDK.
- Armazenar credenciais via variáveis de ambiente (nunca commitar).

---

## 4) Modelagem de dados no Firestore (Collections)

### 4.1 Convenções
- Todo documento multi-tenant deve conter `organizationId`.
- Ids: usar `doc.id` do Firestore ou UUID (padrão do projeto).
- Campos de auditoria: `createdAt`, `updatedAt`, `deletedAt?` quando fizer sentido.

### 4.2 Collections principais

#### organizations
- `id`
- `name`
- `createdAt`, `updatedAt`

#### users
- `id`
- `organizationId`
- `email`
- `name`
- `roles`: array de roles (ex.: `ORG_ADMIN`, `MEMBER`, `DOCTOR`)
- `createdAt`, `updatedAt`

#### inviteTokens
- `id`
- `organizationId`
- `role`: role alvo do convite (`DOCTOR` ou outras)
- `expiresAt`
- `usedAt?`
- `createdAt`

#### patients
- `id`
- `organizationId`
- `patientNumber` (id curto/legível para tabela)
- `name`
- `email`
- `phone`
- `gender`: `MASCULINO | FEMININO | OUTRO`
- `age`
- `bloodType`: `A+ | A- | B+ | B- | AB+ | AB- | O+ | O-`
- `treatment`: `CONSULTA | EXAME | CIRURGIA | TERAPIA | VACINACAO | OUTRO`
- `cpf?`
- `rg?`
- `address`:
  - `street`
  - `district`
  - `city`
  - `state`
  - `number`
- `createdAt`, `updatedAt`, `deletedAt?`

#### doctors
- `id`
- `organizationId`
- `userId` (referência ao usuário autenticado, quando registrado)
- `name`
- `email` (não alterável)
- `phone?`
- `gender`: `MASCULINO | FEMININO | OUTRO`
- `specialty`
- `createdAt`, `updatedAt`, `deletedAt?`

#### appointments
- `id`
- `organizationId`
- `patientId`
- `doctorId`
- `scheduledAt` (date+time)
- `status` (ver lista abaixo)
- `notes` (observação/textarea)
- `createdAt`, `updatedAt`, `deletedAt?`

#### kanbanCards (atendimentos)
- `id`
- `organizationId`
- `patientId?` (se o card for ligado ao paciente)
- `clientName` (nome do cliente/paciente no card)
- `clientPhone` (telefone no card)
- `urgency`: `BAIXA | MEDIA | ALTA | URGENTE`
- `status` (igual ao nome da coluna)
- `createdAt`, `updatedAt`

#### kanbanColumns
- `id`
- `organizationId`
- `name`
- `order`
- `createdAt`, `updatedAt`

---

## 5) Regras de segurança e RBAC (Firestore Rules + Backend)

### 5.1 RBAC
- Manter roles existentes.
- Adicionar role: `DOCTOR`.

### 5.2 Acesso por organização
- Todo acesso deve ser restrito por `organizationId`.
- Estratégia recomendada:
  - Backend valida `auth.organizationId` e aplica filtros no Firestore.
  - Frontend não acessa Firestore diretamente.

### 5.3 Convite por link (médico)
- Criar rota para gerar convite: gera `inviteToken` com role `DOCTOR`.
- Link deve carregar `inviteTokenId`.
- Na tela de registro, ao finalizar cadastro, backend valida token:
  - associa usuário à `organizationId`
  - atribui role `DOCTOR`
  - cria/atualiza doc em `doctors` (com email e vínculo)
  - marca token como usado.

---

## 6) Kanban de atendimento (UI + regras)

### 6.1 Colunas (status)
As colunas devem ser exatamente estas, na ordem:
1. **Agente**
2. **Aguardando atendimento**
3. **Em atendimento**
4. **Finalizado**

Regra: **o nome da coluna é o status atual do card**.

### 6.2 Cards
Cada card deve renderizar:
- Nome do cliente/paciente
- Telefone do cliente/paciente
- Badge de urgência com valores:
  - **Baixa**
  - **Média**
  - **Alta**
  - **Urgente**

### 6.3 Drag and Drop
- Arrastar um card de uma coluna para outra deve atualizar `status` do card para o nome da coluna destino.
- Exemplo: `Agente → Aguardando atendimento`.

---

## 7) Side Menu (navegação)

Manter consistência visual já implementada e adicionar:
- **Agendamentos**
- **Pacientes**

Rotas sugeridas:
- `/dashboard/patients`
- `/dashboard/appointments`
- `/dashboard/doctors`
- `/dashboard/kanban` (ou integrar ao fluxo principal do dashboard)

---

## 8) Tela: Pacientes (tabela + modal reutilizável)

### 8.1 Tabela de pacientes
Colunas:
- Número do paciente (ID resumido / `patientNumber`)
- Nome
- Gênero
- Idade
- Grupo sanguíneo
- Tratamento
- Móvel (coluna placeholder para decidir depois)
- E-mail
- Endereço
- Ações (editar / excluir) com ícones Phosphor

### 8.2 Ações
- Editar: abre modal com formulário preenchido.
- Excluir: remove paciente (soft delete recomendado).

### 8.3 Botão “Cadastrar paciente”
Abre modal com título **Adicionar paciente**.

### 8.4 Formulário (reutilizável para criar/editar)
Campos:
- Nome
- E-mail
- Telefone
- CPF ou RG (ambos podem existir; filtro usa ambos)
- Gênero (options: Masculino, Feminino, Outro)
- Idade
- Grupo sanguíneo (options: A+, A-, B+, B-, AB+, AB-, O+, O-)
- Tratamento (options: Consulta, Exame, Cirurgia, Terapia, Vacinação, Outro)
- Endereço (com inputs separados):
  - Rua
  - Bairro
  - Cidade
  - Estado
  - Número

---

## 9) Tela: Agendamentos (Agendar Consulta)

### 9.1 Seleção obrigatória do paciente
- Agendamento sempre deve ser vinculado a um paciente existente.
- Campo de busca/seleção deve permitir filtrar por:
  - Nome
  - E-mail
  - CPF
  - RG

### 9.2 Campos do agendamento
- Paciente (selecionado)
- Data e hora (`datetime-local` pode servir)
- Status (options):
  - Agendado
  - Primeira consulta
  - Retorno
  - Urgência
  - Emergência
  - Avaliação
  - Encaminhamento
  - Pré-operatório
  - Pós-operatório
  - Manutenção
  - Teleconsulta/Online
  - Retorno remarcado
- Médico especialista (selecionar de médicos cadastrados)
- Observação (textarea)

---

## 10) Tela: Médicos (lista + convite por link + modal)

### 10.1 Listagem em tabela
Colunas:
- ID (curto/legível)
- Nome
- Especialidade
- E-mail
- Telefone
- Gênero
- Ações (editar/excluir) com Phosphor

### 10.2 Convite por link
- Botão “Convidar médico”
- Ao clicar:
  - backend cria token de convite com role `DOCTOR` e orgId
  - UI copia o link para o clipboard

### 10.3 Modal de editar médico
Campos editáveis:
- Nome
- Telefone
- Especialidade (options)
- Gênero

E-mail não é editável.

### 10.4 Lista inicial de especialidades (mínimo 20)
Sugestão inicial (20 opções):
- Cardiologia
- Dermatologia
- Neurologia
- Psiquiatria
- Pediatria
- Ginecologia e Obstetrícia
- Ortopedia e Traumatologia
- Oftalmologia
- Otorrinolaringologia
- Endocrinologia e Metabologia
- Gastroenterologia
- Pneumologia
- Urologia
- Reumatologia
- Nefrologia
- Infectologia
- Hematologia e Hemoterapia
- Oncologia Clínica
- Radiologia e Diagnóstico por Imagem
- Medicina de Família e Comunidade

Fonte de referência (lista de especialidades reconhecidas no Brasil): https://www.grupomedcof.com.br/blog/55-especialidades-medicas/

---

## 11) Migração (Prisma → Firebase) por etapas

### 11.1 Etapa 1: Infra Firebase
- Adicionar Firebase Admin SDK no projeto.
- Criar camada `infrastructure/firebase` para inicialização e helpers.
- Criar wrapper/adapter para operações comuns (get/set/query).

### 11.2 Etapa 2: Adapters/Repositories Firebase
- Criar `Firebase*Repository` para cada repositório atual.
- Manter interfaces em `src/domain/repositories.ts`.
- Atualizar `src/infrastructure/container.ts` para injetar repos Firebase no lugar dos Prisma repos.

### 11.3 Etapa 3: Rotas/API
- Atualizar `src/app/api/*` para usar os serviços/repositórios Firebase.
- Garantir `organizationId` sempre aplicado no backend.

### 11.4 Etapa 4: Dados/coleções novas (Medicina)
- Implementar patients, doctors, appointments, kanbanColumns/kanbanCards.
- Implementar telas e modais.

### 11.5 Etapa 5: Desativação Prisma
- Remover dependências e scripts do Prisma quando tudo estiver migrado.

---

## 12) Checklist de implementação (para sequência do projeto)

- Firebase Admin SDK inicializado com segurança (sem secrets no git).
- Repositórios migrados para Firebase:
  - Projects/Epics/Stories/Tasks
  - Invites/Users/Organizations
- Kanban atendimento:
  - colunas com nomes finais
  - cards com nome/telefone/urgência
  - drag and drop atualiza status
- Side menu atualizado: Pacientes e Agendamentos
- Pacientes:
  - tabela + criar/editar (modal reutilizável)
  - excluir
  - CPF/RG incluídos
- Médicos:
  - tabela + criar/editar/excluir
  - convite por link com role `DOCTOR`
  - especialidades (20 opções)
- Agendamentos:
  - selecionar paciente por nome/email/cpf/rg
  - selecionar médico
  - status completo
  - data/hora + observação

---

## 13) Riscos e cuidados

- Firestore precisa de índices para queries por `organizationId` + campos de busca (nome/email/cpf/rg).
- Evitar acesso direto do frontend ao Firestore para não complexificar regras; preferir `/api`.
- Dados sensíveis (CPF/RG) exigem cuidado:
  - evitar logs
  - validar e armazenar com mínimo necessário
  - considerar mascaramento em UI e permissões.

