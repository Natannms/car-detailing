📦 DOCUMENTAÇÃO DO PROJETO — JIRA LIKE (API FIRST)

Vou dividir em 6 documentos essenciais:

📐 Arquitetura Geral

🏗 Arquitetura Ports & Adapters (API-Oriented)

🗃 Modelo de Dados (DER)

🌐 API Contract (REST)

🔐 Autenticação & Segurança

📄 Fluxo do Backlog Parser Agent

📐 1️⃣ Arquitetura Geral (Architecture.md)
# JIRA-LIKE - Architecture Overview

## 🎯 Objetivo

Construir um sistema de gestão de backlog inspirado no Jira,
orientado a API, permitindo integração com:

- MCP Servers
- Sistemas externos
- Agents ADK
- Ferramentas de automação

## 🏗 Princípios

1. API FIRST
2. Ports & Adapters
3. Clean Architecture
4. SOLID (DIP obrigatório)
5. Multi-tenant
6. Segurança por padrão

## 🔁 Fluxo Geral

Client / Agent / External System
        ↓
Next.js API (Route Handlers)
        ↓
Application Services
        ↓
Repositories (Port)
        ↓
Database Adapter

🏗 2️⃣ Arquitetura Técnica (Ports & Adapters)

Baseada no modelo 

PortsAndAdaptersSolutoin

 porém adaptado para API.

Estrutura do projeto:

/src
 ├── domain
 │    ├── entities
 │    ├── repositories (interfaces)
 │
 ├── application
 │    ├── services
 │
 ├── ports
 │    ├── DatabasePort.ts
 │
 ├── adapters
 │    ├── postgres
 │    ├── firestore
 │
 ├── infrastructure
 │    ├── container.ts
 │
 ├── api
 │    ├── epics
 │    ├── stories
 │    ├── tasks
 │    ├── sprints
 │    ├── backlog-parser

🌐 3️⃣ Estrutura da API (REST Oriented)

Agora tudo será via API Routes.

🔵 EPICS
POST   /api/epics
GET    /api/epics
GET    /api/epics/:id
PUT    /api/epics/:id
DELETE /api/epics/:id

🟢 STORIES
POST   /api/stories
GET    /api/stories
GET    /api/stories/:id
PUT    /api/stories/:id
DELETE /api/stories/:id

🟡 TASKS
POST   /api/tasks
GET    /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id

🟣 SPRINTS
POST /api/sprints
GET  /api/sprints
PUT  /api/sprints/:id

🤖 BACKLOG PARSER
POST /api/backlog-parser/import


Payload:

{
  "projectId": "uuid",
  "markdown": "conteudo do backlog.md"
}

🗃 4️⃣ DER FINAL (PostgreSQL Exemplo)
Project
- id (uuid pk)
- name
- created_at

Sprint
- id (uuid pk)
- project_id (fk)
- name
- goal
- status
- start_date
- end_date

Epic
- id (uuid pk)
- project_id (fk)
- title
- context
- expected_result
- status

Story
- id (uuid pk)
- epic_id (fk)
- sprint_id (fk nullable)
- title
- user_story
- acceptance_criteria
- status
- story_points

Task
- id (uuid pk)
- story_id (fk)
- title
- description
- status

Subtask
- id (uuid pk)
- task_id (fk)
- title
- status

Bug
- id (uuid pk)
- project_id (fk)
- epic_id (fk nullable)
- sprint_id (fk nullable)
- title
- environment
- repro_steps
- expected_result
- actual_result
- status


Índices únicos:

UNIQUE(project_id, title) -- epic
UNIQUE(epic_id, title) -- story
UNIQUE(story_id, title) -- task
UNIQUE(task_id, title) -- subtask

🔐 5️⃣ Segurança

Diferente do outro projeto 

Arquitetura

Aqui:

JWT obrigatório em todas APIs

organization_id obrigatório

middleware valida tenant

RBAC aplicado na camada de Application

if (!user.roles.includes("ORG_ADMIN")) {
   throw new ForbiddenError()
}

🤖 6️⃣ Fluxo do Backlog Import Agent (ADK)

Fluxo real:

Agent recebe markdown

Chama API /api/backlog-parser/import

API:

Parse

Resolve Sprint

Upsert Epic

Upsert Story

Upsert Task

Upsert Subtask

Responde com relatório:

{
  "epicsCreated": 2,
  "epicsUpdated": 1,
  "storiesCreated": 8,
  "duplicatesIgnored": 3
}

🚀 Diferença Fundamental (Server Action vs API)
Server Action	API
Acoplado ao frontend	Exposto externamente
Não ideal para integração	Ideal para MCP
Dificulta versionamento	Permite versionamento REST
Difícil observabilidade	Melhor logging