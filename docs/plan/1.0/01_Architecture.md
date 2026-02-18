# JIRA-LIKE - Architecture Overview (v1.0)

## 🎯 Objetivo

Construir um sistema de gestão de backlog inspirado no Jira, orientado a API, permitindo integração com:
- MCP Servers
- Sistemas externos
- Agents ADK
- Ferramentas de automação

## 🏗 Princípios

1. **API FIRST**: Toda funcionalidade começa pela API.
2. **Ports & Adapters**: Isolamento do domínio.
3. **Clean Architecture**: Dependência aponta para dentro.
4. **SOLID**: Foco em DIP (Dependency Inversion Principle).
5. **Multi-tenant**: Dados segregados por `organization_id`.
6. **Segurança por padrão**: Autenticação e Autorização em tudo.

## 🔁 Fluxo Geral

```mermaid
graph TD
    Client[Client / Agent / External System] -->|Request| API[Next.js API (Route Handlers)]
    API -->|DTO| Service[Application Services]
    Service -->|Interface| Port[Repositories (Port)]
    Port -->|Implementation| Adapter[Database Adapter]
    Adapter -->|Prisma Client| DB[(PostgreSQL)]
```

## 🏗 Arquitetura Técnica (Ports & Adapters)

Baseada no modelo Ports & Adapters, adaptado para Next.js API Routes.

### Estrutura de Pastas

```
/src
 ├── domain
 │    ├── entities       # Regras de Negócio Puras
 │    ├── repositories   # Interfaces (Portas)
 │
 ├── application
 │    ├── services       # Casos de Uso
 │    ├── dtos           # Contratos de Entrada/Saída
 │
 ├── infrastructure
 │    ├── database       # Configuração de DB (Prisma Client)
 │    ├── container.ts   # Injeção de Dependência
 │
 ├── adapters
 │    ├── repositories   # Implementação das Portas (Prisma/Postgres)
 │
 ├── app
 │    ├── api            # Route Handlers (Controllers)
 │         ├── epics
 │         ├── stories
 │         ├── tasks
 │         ├── backlog-parser
```

## 🌐 Estrutura da API (REST Oriented)

Tudo será exposto via API Routes.

### 🔵 EPICS
- `POST   /api/epics` - Criar Épico
- `GET    /api/epics` - Listar Épicos (filtro por projeto)
- `GET    /api/epics/:id` - Detalhes
- `PUT    /api/epics/:id` - Atualizar
- `DELETE /api/epics/:id` - Remover

### 🟢 STORIES
- `POST   /api/stories`
- `GET    /api/stories`
- `GET    /api/stories/:id`
- `PUT    /api/stories/:id`
- `DELETE /api/stories/:id`

### 🟡 TASKS
- `POST   /api/tasks`
- `GET    /api/tasks`
- `PUT    /api/tasks/:id`
- `DELETE /api/tasks/:id`

### 🟣 SPRINTS
- `POST   /api/sprints`
- `GET    /api/sprints`
- `PUT    /api/sprints/:id`

### 🤖 BACKLOG PARSER
- `POST /api/backlog-parser/import`

**Payload:**
```json
{
  "projectId": "uuid",
  "markdown": "# Título do Backlog\n\n## Épico 1..."
}
```

## 🗃 Modelo de Dados (DER Simplificado)

### Project
- `id` (uuid pk)
- `name`
- `organization_id` (tenant)

### Epic
- `id` (uuid pk)
- `project_id` (fk)
- `title`
- `context`
- `expected_result`
- `status`

### Story
- `id` (uuid pk)
- `epic_id` (fk)
- `sprint_id` (fk nullable)
- `title`
- `user_story` (Eu como... Quero... Para...)
- `acceptance_criteria`
- `status`
- `points`

### Task
- `id` (uuid pk)
- `story_id` (fk)
- `title`
- `description`
- `status`

### Restrições de Unicidade
- `UNIQUE(project_id, title)` para Epics
- `UNIQUE(epic_id, title)` para Stories

## 🔐 Segurança

- **JWT Obrigatório**: Todas as rotas protegidas (exceto login/health).
- **Tenant Isolation**: Middleware valida se o usuário tem acesso ao `project_id` solicitado.
- **RBAC**: Application Service verifica permissões (`ORG_ADMIN`, `MEMBER`).
