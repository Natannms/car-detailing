# Estratégia de Unidades (MARCA AI)

Este documento define como vamos modelar **unidades** (filiais/lojas/franquias) por organização, alinhar isso com **planos** de assinatura e isolar os dados por unidade.

## 1) Conceitos

- **Organization**: conta raiz de uma empresa (já existe).
- **Unit**: unidade física/filial associada a uma organização (nova entidade).
- **User**: sempre pertence a uma organização; poderá estar associado a uma unidade principal.
- **Plan**: define limites de unidades por organização.

### Níveis
- **Conta principal** → sempre cria **1 Organization**.
- **Organization** → pode ter 1..N **Units** (limitado pelo plano).
- **Unit** → é o escopo padrão para dados operacionais (pacientes, agendamentos, etc.).

## 2) Planos e limites

Collection sugerida: `plans`

- Campos:
  - `id` (ex.: `basic`, `premium`, `enterprise`)
  - `name`
  - `description`
  - `monthlyPrice`
  - `maxUnits` (null = ilimitado / negociado)
  - `features` (lista)

Planos:
- **Basic**
  - `maxUnits = 1`
  - Uma unidade por organização
- **Premium**
  - `maxUnits = 6`
  - Até 6 unidades por organização
- **Enterprise**
  - `maxUnits = null`
  - Necessário falar com consultor
  - Gera registro em coleção específica (ex.: `enterpriseLeads`)

Integração com Billing:
- `organizationBilling` passa a ter referência ao plano:
  - `planId: "basic" | "premium" | "enterprise"`
  - Limite de unidades derivado do plano ativo.

## 3) Modelagem de Unidades

Nova entidade `Unit` (collection `units`):

- `id`
- `organizationId`
- `name`
- `slug` (opcional, para URLs amigáveis)
- `phone` (opcional)
- `address` (opcional)
- `createdAt`
- `updatedAt`
- `deletedAt`

Regras:
- Cada unit pertence a exatamente uma organization.
- Uma organization deve ter **pelo menos 1 unit ativa**.
- Ao criar a organização, criamos automaticamente a “unidade principal”.

## 4) Relacionamento com dados existentes

Todas as coleções operacionais passam a ter `unitId`, exceto billing:

- Deve ter `unitId`:
  - `patients`
  - `appointments`
  - `doctors` (opcionalmente pode atender em mais de uma unit, mas teremos `primaryUnitId` inicial)
  - `medicalKanbanCards` (fila de atendimento de determinada unidade)
  - Qualquer entidade futura ligada ao fluxo operacional

- **Não terá `unitId`**:
  - `organizationBilling` (billing da organização como um todo)
  - `asaasPayments`
  - `asaasWebhookEvents`
  - `plans`
  - `enterpriseLeads`

## 5) Isolamento por unidade no backend

### AuthContext

Hoje: `AuthContext` tem `userId`, `organizationId`, `roles`.

Nova abordagem:
- Adicionar `unitId` atual no contexto (ex.: `AuthContext` com `unitId`).
- Essa `unitId` virá de:
  - Preferência do usuário (unidade selecionada na UI)
  - Ou unidade padrão (primaryUnitId) do usuário.

### Services e Repositórios
- Todos os métodos que listam/buscam dados operacionais devem:
  - Filtrar por `organizationId` **e** `unitId` (quando fizer sentido).
  - Quando criar registros, preencher `unitId` com a unidade atual do contexto.

Exemplos:
- `PatientRepository.create` recebe `{ organizationId, unitId, ... }`.
- `AppointmentRepository.listByOrganization` migra para variante mais específica:
  - `listByOrgAndUnit(organizationId, unitId)`.

### Regras por role

- `ORG_ADMIN`:
  - Pode ver/gerenciar múltiplas unidades (possível selecionar unit em um switch).
  - Ainda assim, qualquer ação em dados concretos precisa de uma `unitId` ativa.

- `MEMBER` / `DOCTOR`:
  - Em geral, ficam restritos à `unitId` associada.
  - Se tiver permissão multi-unit, explicitamente atribuída, poderá alternar.

## 6) UI: seleção de unidade

Para usuários com acesso a mais de uma unit:
- Adicionar no shell (ex.: header) um **selector de unidade**:
  - Exibe a unidade atual.
  - Lista de units disponíveis para o usuário.
  - Ao trocar, persiste em localStorage e refaz chamadas com nova `unitId`.

Para usuários com uma única unit:
- Usar essa unit automaticamente, sem selector.

## 7) Integração com planos

Fluxo para criação de unidades:
- Antes de criar nova unit:
  - Carregar `organizationBilling.planId` e o registro de `plans`.
  - Contar quantas units ativas a organization já possui.
  - Bloquear criação se `count >= maxUnits` (para Basic/Premium).
  - Para Enterprise (`maxUnits = null`):
    - Permitir.

Upgrade/downgrade de plano:
- Ao atualizar o plano na Billing:
  - Se novo plano tiver `maxUnits` menor que o número atual de units:
    - Não apagar units automaticamente.
    - Apenas bloquear criação de novas unidades até ajustar o plano ou desativar algumas units.

## 8) Rota / Landing page e planos

Landing `/`:
- Deixa de redirecionar automaticamente.
- Nova página com:
  - Hero explicando MARCA AI.
  - Seção explicando 3 pilares do produto.
  - Seção de planos usando dados vindos de `plans`:
    - Basic (R$ 21,90)
    - Premium (R$ 31,90)
    - Enterprise (R$ 99,90 / falar com consultor)

Seed:
- Script/seed em Firebase (ou rota admin) para inserir 3 planos na collection `plans`.
- Landing lê planos via `useSseSnapshot` ou fetch simples da API `/api/plans`.

Enterprise lead:
- Ao clicar em “Falar com consultor”:
  - Abrir modal com nome, email, empresa, tamanho previsto.
  - Salvar em `enterpriseLeads` com `planId: "enterprise"` e `organizationId` (se logado, opcional).

## 9) Passos de implementação (ordem sugerida)

1) **Planos**
   - Criar collection `plans` + seeder (3 planos).
   - API para listar planos (pública).
   - Landing page `/` consumindo esses dados.

2) **Modelo de unidades**
   - Criar entidade `Unit` + repositório Firebase.
   - Criar unit inicial ao criar organization.
   - Adicionar `unitId` nas coleções operacionais novas (a partir daqui).

3) **Contexto de unidade**
   - Extender `AuthContext` com `unitId`.
   - Criar selector de unidade no dashboard para múltiplas units.
   - Adaptar services para considerar `unitId`.

4) **Regras de plano**
   - Ligar `organizationBilling.planId` aos planos.
   - Antes de criar unit, validar limite `maxUnits`.

5) **Migração suave**
   - Para dados já existentes, considerar `unitId = unidade principal` por padrão.
   - Só depois disso, expandir collections antigas (se necessário).

