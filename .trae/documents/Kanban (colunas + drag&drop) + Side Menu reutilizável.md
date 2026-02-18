## Onde o Kanban vai entrar
- Hoje não existe um Kanban “real” no código; a área mais adequada para Kanban + cards com status é a seção de **Tasks** dentro da Story.
- Vou transformar a lista de tasks em um **Kanban Board** onde:
  - cada coluna representa um `status`
  - cada card é uma task
  - arrastar o card entre colunas atualiza o `status` via API.

## 1) Kanban – Estilo (colunas e cards)
- **Colunas**
  - Remover shadow das colunas (ficam com fundo leve + borda sutil).
  - Coluna com altura flexível e lista interna com `overflow-y: auto` para comportar muitos cards.
  - Container responsivo com `overflow-x: auto` para mobile/tablet.
- **Cards**
  - Adicionar shadow nos cards para ficarem mais destacados.
  - Manter consistência do design atual (cores, radius, tipografia).

## 2) Kanban – CRUD de colunas
- Adicionar botão **“Nova coluna”** no topo do board.
- Em cada coluna, ao clicar nos **3 pontinhos**, abrir um dropmenu com:
  - **Renomear coluna** (inline/mini modal)
  - **Excluir coluna**
- Regras ao excluir coluna:
  - se houver cards nela, mover automaticamente para a primeira coluna (ex.: TODO) antes de excluir.

## 3) Kanban – Drag and Drop (arrasta e solta)
- Implementar drag & drop para:
  - mover card entre colunas (troca `status`)
  - reordenar dentro da mesma coluna (opcional, mas já deixo pronto)
- Persistência:
  - ao soltar, chamar `PUT /api/tasks/:id` atualizando `status` com o nome da coluna destino.

## 4) Persistência das colunas (backend + Prisma)
- Criar um modelo novo no Prisma para guardar as colunas do Kanban por Story:
  - `TaskBoardColumn { id, storyId, name, order, createdAt, updatedAt }`
- Criar APIs:
  - `GET /api/task-board-columns?storyId=...` (listar)
  - `POST /api/task-board-columns` (criar)
  - `PUT /api/task-board-columns/:id` (renomear / reorder)
  - `DELETE /api/task-board-columns/:id` (excluir)
- Criar serviço/repositório (padrão atual do projeto) para validações e multi-tenant (via Project/Epic/Story → organizationId).

## 5) Refator Side Menu (reutilizável e full height)
- Extrair o side menu para um componente reutilizável em `src/components/...`.
- Atualizar o layout do dashboard para:
  - side menu ocupar **100% da altura**
  - remover `rounded` das bordas do side menu (fica reto/flush)
  - manter o mesmo visual/consistência.

## 6) Arquivos que serão alterados/criados (alto nível)
- UI Kanban:
  - Atualizar: `src/app/projects/[projectId]/stories/[storyId]/page.tsx`
  - Criar componentes: `src/components/kanban/*` (Board, Column, Card, Menu)
- Backend colunas:
  - Atualizar: `prisma/schema.prisma`
  - Criar repo/service + rotas em `src/app/api/task-board-columns/*`
- Side menu:
  - Criar: `src/components/navigation/SideMenu.tsx` (ou similar)
  - Atualizar: `src/app/dashboard/layout.tsx`

## 7) Validação
- Fluxo manual em dev:
  - abrir uma story → ver kanban → criar coluna → renomear/excluir → arrastar cards e ver status mudar.
- Ajustar testes unitários (services) para colunas (create/rename/delete).

Se você aprovar este plano, eu implemento tudo em sequência (UI+backend+prisma) mantendo a consistência visual que você gostou.