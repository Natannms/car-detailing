# Guia de Estilização (Tailwind + shadcn/ui)

## Objetivo
Este projeto usa **Tailwind CSS** como base de utilitários e **shadcn/ui** como distribuição de componentes (código no repositório, sem dependência de “component library” fechada).

## Estrutura adotada no repositório
- Tokens e estilos globais: [globals.css](file:///d:/PROJETOS/ghork/kanban-AI/src/app/globals.css)
- Config Tailwind: [tailwind.config.ts](file:///d:/PROJETOS/ghork/kanban-AI/tailwind.config.ts)
- PostCSS: [postcss.config.mjs](file:///d:/PROJETOS/ghork/kanban-AI/postcss.config.mjs)
- Config do shadcn CLI: [components.json](file:///d:/PROJETOS/ghork/kanban-AI/components.json)
- UI primitives (shadcn): `src/components/ui/*`
- Utils (cn/classnames): [utils.ts](file:///d:/PROJETOS/ghork/kanban-AI/src/lib/utils.ts)

## Instalação (padrão shadcn/ui para Next.js)
O fluxo recomendado pelo shadcn/ui é:
1. Configurar Tailwind no projeto.
2. Rodar o init do shadcn para gerar `components.json`.
3. Adicionar componentes com o CLI (`add`) e importar do caminho `@/components/ui/...`.

Exemplo de import e uso (padrão do shadcn/ui):
```tsx
import { Button } from "@/components/ui/button";

export function Example() {
  return <Button>Clique</Button>;
}
```

## Convenções de estilo (CSS variables)
### Por que CSS variables
Usamos CSS variables porque isso permite que os componentes usem classes semânticas como:
- `bg-background text-foreground`
- `bg-primary text-primary-foreground`

Sem acoplar o componente a cores “hardcoded” como `bg-zinc-950`.

### Onde ficam os tokens
Os tokens ficam em:
- `:root` (tema claro)
- `.dark` (tema escuro)

Veja: [globals.css](file:///d:/PROJETOS/ghork/kanban-AI/src/app/globals.css)

### Como o Tailwind enxerga as variáveis
No Tailwind v4, o shadcn usa `@theme inline` para mapear os tokens para o namespace do Tailwind (ex.: `--color-primary` aponta para `--primary`). Isso permite usar classes como `bg-primary`.

### Como personalizar o tema
1. Atualize os valores em `:root` e `.dark`.
2. Se adicionar um token novo (ex.: `--warning`), exponha ele no Tailwind via `@theme inline`.

Exemplo:
```css
:root {
  --warning: oklch(0.84 0.16 84);
  --warning-foreground: oklch(0.28 0.07 46);
}

.dark {
  --warning: oklch(0.41 0.11 46);
  --warning-foreground: oklch(0.99 0.02 95);
}

@theme inline {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

Uso:
```tsx
<div className="bg-warning text-warning-foreground">Aviso</div>
```

## Como adicionar componentes shadcn/ui
### Via CLI (recomendado)
O shadcn/ui é “código gerado”. Você adiciona apenas o que usa.

Exemplo (Button):
```bash
npx shadcn@latest add button
```

Depois:
```tsx
import { Button } from "@/components/ui/button";
```

### Manual (fallback)
Se o CLI não funcionar no seu ambiente, o caminho manual é:
1. Criar o arquivo em `src/components/ui/<componente>.tsx` copiando o código do docs do shadcn.
2. Garantir as dependências do componente no `package.json`.
3. Ajustar imports para usar `@/lib/utils` e `@/components/ui/...`.

## Catálogo de componentes (shadcn/ui)
Esta lista cobre os tipos documentados pelo shadcn/ui (instalação via `shadcn add <nome>` e import via `@/components/ui/<nome>`):

### Primitivos de Ação e Feedback
- Button (`button`)
- Button Group (`button-group`)
- Spinner (`spinner`)
- Sonner (`sonner`)
- Toast (`toast`) (no shadcn mais recente, o “toast” tende a ser substituído por sonner)
- Alert (`alert`)

### Layout e Estrutura
- Card (`card`)
- Separator (`separator`)
- Skeleton (`skeleton`)
- Scroll Area (`scroll-area`)
- Resizable (`resizable`)
- Aspect Ratio (`aspect-ratio`)

### Navegação e Menus
- Breadcrumb (`breadcrumb`)
- Navigation Menu (`navigation-menu`)
- Menubar (`menubar`)
- Dropdown Menu (`dropdown-menu`)
- Context Menu (`context-menu`)
- Pagination (`pagination`)
- Sidebar (`sidebar`)

### Overlays
- Dialog (`dialog`)
- Alert Dialog (`alert-dialog`)
- Drawer (`drawer`)
- Sheet (`sheet`)
- Popover (`popover`)
- Tooltip (`tooltip`)
- Hover Card (`hover-card`)

### Forms e Inputs
- Input (`input`)
- Textarea (`textarea`)
- Label (`label`)
- Checkbox (`checkbox`)
- Switch (`switch`)
- Radio Group (`radio-group`)
- Select (`select`)
- Native Select (`native-select`)
- Combobox (`combobox`)
- Input OTP (`input-otp`)
- Input Group (`input-group`)
- Field (`field`)

### Data Display e Conteúdo
- Avatar (`avatar`)
- Badge (`badge`)
- Tabs (`tabs`)
- Table (`table`)
- Data Table (`data-table`)
- Chart (`chart`)
- Calendar (`calendar`)
- Date Picker (`date-picker`)
- Progress (`progress`)
- Typography (`typography`)
- Kbd (`kbd`)
- Empty (`empty`)
- Item (`item`)

## Componentes existentes no projeto (custom)
O projeto já possui alguns componentes/padrões próprios que podem ser migrados gradualmente para Tailwind/shadcn:
- Shell de layout e navegação: [AppShell](file:///d:/PROJETOS/ghork/kanban-AI/src/app/shell/AppShell.tsx)
- Dashboard (layout + menu): [dashboard/layout.tsx](file:///d:/PROJETOS/ghork/kanban-AI/src/app/dashboard/layout.tsx), [sideMenu.tsx](file:///d:/PROJETOS/ghork/kanban-AI/src/app/dashboard/sideMenu.tsx)

Recomendação: ao tocar nessas telas, substituir `style={{ ... }}` por classes Tailwind e/ou wrappers com componentes shadcn (ex.: `Button`, `Card`, `Sidebar`).

## Boas práticas
- Adicionar componentes “on demand”: só rode `add` para o que for usar agora.
- Evitar duplicar estilos inline; padronizar com classes e tokens.
- Manter imports consistentes:
  - `@/components/ui/*` para primitives
  - `@/lib/utils` para `cn`
