## Objetivo
- Padronizar a estilização do projeto com **Tailwind + shadcn/ui**, criando um “design system” incremental.
- Criar um **GUIA** em `docs/GUIDES/` com:
  - Instalação/configuração para Next.js (conforme docs de instalação).
  - Instruções de **theming** (CSS variables recomendadas) conforme docs de theming.
  - Um **catálogo** com “todo tipo de componente” do shadcn/ui e um mini-guia de uso.

## Diagnóstico do Projeto (estado atual)
- Não existe `tailwind.config.*` no repo.
- `src/app/globals.css` existe, mas ainda não usa Tailwind nem tokens shadcn.
- Não existe `src/components/ui` (padrão do shadcn).
- O projeto já tem alias `@/*` configurado: [tsconfig.json](file:///d:/PROJETOS/ghork/kanban-AI/tsconfig.json).

## Plano de Estilização (técnico)
### 1) Instalar e configurar Tailwind no Next.js
- Adicionar dependências de Tailwind + PostCSS.
- Criar/ajustar:
  - `tailwind.config.ts` apontando `content` para `src/app/**/*.{ts,tsx}`, `src/components/**/*.{ts,tsx}`, etc.
  - `postcss.config.mjs`.
  - Atualizar `src/app/globals.css` para incluir `@tailwind base; @tailwind components; @tailwind utilities;`.

### 2) Inicializar shadcn/ui no projeto
- Rodar o init do shadcn (conforme instalação para Next.js) para criar `components.json` e estrutura.
- Fixar convenções:
  - `style: "new-york"`
  - `tailwind.cssVariables: true` (recomendado)
  - `aliases` usando o alias já existente `@/*`.
- Adicionar utilitários padrão do shadcn (`cn` / `utils`) e dependências típicas (ex.: `clsx` e `tailwind-merge`) via CLI.

### 3) Definir tokens de tema (CSS variables) no globals.css
- Substituir os tokens atuais por um conjunto compatível com shadcn (background/foreground + tokens de UI e sidebar).
- Adotar a convenção:
  - `bg-background text-foreground`
  - `bg-primary text-primary-foreground`
- Garantir suporte `.dark` e `color-scheme`.

### 4) Criar baseline de layout usando classes utilitárias
- Definir padrões de layout reutilizáveis:
  - Container/spacing/tipografia.
  - Sidebar “dashboard” compatível com tokens `--sidebar-*`.
- (Opcional, mas recomendado) Migrar gradualmente páginas existentes de `style={{...}}` para classes Tailwind e/ou componentes shadcn.

## Catálogo de Componentes (o que entra no GUIA)
No guia, vou listar e explicar como instalar e usar cada tipo de componente documentado no shadcn/ui (via CLI `shadcn add <nome>`), com:
- Nome do componente
- Como adicionar (comando)
- Import padrão `@/components/ui/<...>`
- Exemplo mínimo de uso

Lista (derivada dos arquivos de docs do shadcn/ui):
- Accordion
- Alert Dialog
- Alert
- Aspect Ratio
- Avatar
- Badge
- Breadcrumb
- Button Group
- Button
- Calendar
- Card
- Carousel
- Chart
- Checkbox
- Collapsible
- Combobox
- Command
- Context Menu
- Data Table
- Date Picker
- Dialog
- Direction
- Drawer
- Dropdown Menu
- Empty
- Field
- Hover Card
- Input Group
- Input OTP
- Input
- Item
- Kbd
- Label
- Menubar
- Native Select
- Navigation Menu
- Pagination
- Popover
- Progress
- Radio Group
- Resizable
- Scroll Area
- Select
- Separator
- Sheet
- Sidebar
- Skeleton
- Slider
- Sonner
- Spinner
- Switch
- Table
- Tabs
- Textarea
- Toast
- Toggle Group
- Toggle
- Tooltip
- Typography

## Theming (o que entra no GUIA)
- Explicar as duas abordagens do shadcn:
  - CSS variables (recomendada)
  - Utility classes
- Explicar como personalizar:
  - `components.json` com `tailwind.cssVariables: true`.
  - Ajustar as variáveis em `src/app/globals.css` em `:root` e `.dark`.
  - Adicionar novas cores e disponibilizar via Tailwind (quando aplicável) usando o padrão indicado na doc.

## Documentação (arquivos que serão criados/alterados)
- Criar um guia principal:
  - `docs/GUIDES/UI_Styling_Shared_Sharedcn.md` (nome final pode ser `Shadcn_UI_Guide.md`)
  - Conteúdo: instalação, estrutura de pastas, padrões de uso, catálogo de componentes, theming.
- Atualizar `src/app/globals.css` para tokens shadcn + tailwind directives.
- Criar configs Tailwind/PostCSS.
- Criar `components.json` do shadcn.

## Critérios de Aceite (verificação)
- `npm run build` passa.
- Um componente shadcn (ex.: Button) é adicionado e usado em uma página de exemplo.
- O guia em `docs/GUIDES/` cobre:
  - instalação
  - theming
  - catálogo + exemplos mínimos

Se você aprovar, eu executo o setup Tailwind + shadcn no repo e adiciono o guia completo com o catálogo e exemplos.