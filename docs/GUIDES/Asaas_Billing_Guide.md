# Guia Asaas (Billing + Subscription + Webhook)

Este documento descreve como integrar o Asaas para:

- Criar **Customer** (cliente/pagador) ao criar a **organização** no app
- Criar **Subscription** (assinatura mensal) com **PIX** ou **Cartão**
- Exibir **histórico de pagamentos** e **link de pagamento** na tela de Billing
- Receber eventos em **um único webhook** (`/webhook/asaas`) para sincronizar status e liberar/bloquear o acesso ao sistema

## 1) Conceitos do Asaas

### Customer
- Antes de cobrar, é necessário criar o **Customer** no Asaas.
- O Asaas permite a criação de clientes duplicados, então a aplicação deve validar duplicidade (por exemplo, por email/telefone/documento) antes de criar um novo customer.
- Endpoint: `POST /v3/customers`
- Documentação: https://docs.asaas.com/reference/criar-novo-cliente

### Subscription
- A assinatura cria cobranças recorrentes (mensais, no nosso caso).
- `nextDueDate` define o vencimento da **primeira cobrança**; para forçar pagamento inicial no mesmo dia, usar `nextDueDate = hoje`.
- Formas de pagamento permitidas no nosso fluxo:
  - `PIX`
  - `CREDIT_CARD`
- Endpoint: `POST /v3/subscriptions`
- Documentação: https://docs.asaas.com/reference/criar-nova-assinatura

Observação importante:
- Na assinatura, a cobrança não vem “junto” na criação (o Asaas cria a cobrança após a assinatura). Para obter o `invoiceUrl` (link de pagamento), a aplicação deve:
  - Consumir `GET /v3/subscriptions/{id}/payments`, **ou**
  - Processar o webhook de pagamentos (ex.: `PAYMENT_CREATED` / `PAYMENT_RECEIVED`) e identificar a cobrança ligada à assinatura.

## 2) Ambientes e URL base

- Sandbox: `https://api-sandbox.asaas.com/v3`
- Produção: `https://api.asaas.com/v3`

Recomendação: controlar o ambiente por variável server-side (sem `NEXT_PUBLIC_*`).

## 3) Autenticação e segurança

### Chamadas API
- Enviar `access_token` no header (token do Asaas).
- O token deve ficar apenas no servidor (env sem `NEXT_PUBLIC_*`).

### Webhook
O Asaas recomenda configurar um `authToken` no webhook e validar o header `asaas-access-token` em todas as chamadas recebidas.
- Documentação (criação de webhook via API): https://docs.asaas.com/docs/create-new-webhook-via-api
- Documentação (receber eventos): https://docs.asaas.com/docs/receive-asaas-events-at-your-webhook-endpoint

Boas práticas:
- Responder 200 rapidamente.
- Implementar idempotência por `event.id` (o Asaas pode reenviar eventos).
- Não quebrar o handler quando surgirem campos novos no payload.
- Opcional: allowlist de IPs do Asaas no firewall.

## 4) Eventos e sincronização

### Pagamentos (Payments)
O controle de “assinatura paga” deve ser baseado em **eventos de cobrança**, pois é o pagamento que determina liberação.

Eventos úteis para o fluxo:
- `PAYMENT_CREATED` (nova cobrança gerada)
- `PAYMENT_CONFIRMED` (pagamento efetuado, saldo ainda não disponível – comum em cartão)
- `PAYMENT_RECEIVED` (pagamento recebido)
- `PAYMENT_OVERDUE` (vencida)
- `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED` (falha no cartão)
- `PAYMENT_REFUNDED` (estorno)

Documentação (events):  
https://docs.asaas.com/docs/webhook-para-cobrancas

### Assinaturas (Subscriptions)
Eventos úteis para auditoria/diagnóstico:
- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_UPDATED`
- `SUBSCRIPTION_INACTIVATED`
- `SUBSCRIPTION_DELETED`

Documentação:  
https://docs.asaas.com/docs/subscription-events

## 5) Fluxo ideal (negócio)

### 5.1) Criação de conta / organização
1) Usuário cria conta (email/senha) como já acontece.
2) Ao criar a organização (ou no primeiro acesso), solicitar dados para billing:
   - Nome/razão social (pessoa física/jurídica)
   - Documento (CPF/CNPJ)
   - Email
   - Telefone
   - Endereço (opcional, mas recomendado)
3) No servidor:
   - Criar `Customer` no Asaas.
   - Criar `Subscription` no Asaas com:
     - `billingType`: `PIX` ou `CREDIT_CARD`
     - `cycle`: `MONTHLY`
     - `nextDueDate`: hoje (força primeira cobrança hoje)
4) Recuperar a cobrança inicial para mostrar o `invoiceUrl`:
   - Preferencial: via webhook `PAYMENT_CREATED` (com `payment.subscription = <subscriptionId>`)
   - Alternativa: polling `GET /v3/subscriptions/{id}/payments`

### 5.2) Bloqueio de acesso (gate por organização)
Regra: uma organização só pode usar o software se existir uma assinatura válida para ela.

Critério de “válida” recomendado:
- Última cobrança relevante está `RECEIVED` (ou equivalente) e
- `validUntil` (ou `paidThrough`) >= hoje

O bloqueio deve ocorrer no backend (services/server actions):
- Permitir **sempre** endpoints/páginas necessários para Billing e autenticação.
- Bloquear o resto com erro consistente: `402 PAYMENT_REQUIRED` (ou `403`) com `code: "SUBSCRIPTION_REQUIRED"`.

Benefícios:
- Qualquer membro (`MEMBER`/`DOCTOR`) herda o bloqueio da org.
- Evita uso do sistema enquanto não houver pagamento inicial ou quando inadimplente.

### 5.3) Billing page
Objetivos:
1) Mostrar histórico de cobranças mensais (e seus status).
2) Permitir gerar/abrir o link de pagamento da mensalidade vigente.

Comportamento do link (`invoiceUrl`):
- O `invoiceUrl` pertence a uma cobrança (`payment`) e tem vencimento.
- O app deve manter um “ponteiro” para a **cobrança vigente** a ser paga (ex.: `currentPaymentId`).
- Se uma cobrança expirar/ficar overdue, o app deve permitir pagar a **cobrança mais recente pendente** da assinatura.
  - Mecanismo recomendado: sempre buscar via API/listagem ou via webhooks o último payment `PENDING/OVERDUE` e usar o `invoiceUrl` dele.
- Evitar que o usuário “pague o link antigo” exibindo apenas a cobrança vigente.

## 6) Modelo de dados (sugestão)

### organizationBilling (por organizationId)
- `organizationId`
- `asaasCustomerId`
- `asaasSubscriptionId`
- `billingType` (`PIX` | `CREDIT_CARD`)
- `status` (`TRIAL` | `PENDING` | `ACTIVE` | `PAST_DUE` | `CANCELED`)
- `validUntil` (data)
- `currentPaymentId` (Asaas payment id)
- `currentInvoiceUrl` (url)
- `updatedAt`

### asaasPayments (histórico)
- `organizationId`
- `paymentId`
- `subscriptionId`
- `status`
- `invoiceUrl`
- `value`
- `dueDate`
- `paidAt`
- `raw` (payload bruto ou subset)

### asaasWebhookEvents (idempotência)
- `eventId` (o `id` do webhook)
- `eventType` (`PAYMENT_RECEIVED`, etc.)
- `receivedAt`
- `processedAt`

## 7) Webhook único da aplicação

### Endpoint
- `POST /webhook/asaas`

### Validação
- Verificar header `asaas-access-token` contra `ASAAS_WEBHOOK_TOKEN` (env server-side).

### Processamento (alto nível)
- Identificar `body.event`
- Se `PAYMENT_*`:
  - Capturar `payment.subscription`, `payment.customer`, `payment.status`, `payment.invoiceUrl`, etc.
  - Atualizar o `organizationBilling` correspondente (via mapeamento subscriptionId -> org).
  - Inserir no histórico `asaasPayments`
  - Recalcular `validUntil` (ex.: adicionar 30 dias a partir do dueDate pago, ou basear na próxima mensalidade)
- Se `SUBSCRIPTION_*`:
  - Atualizar status de auditoria (sem depender disso para liberar acesso)

### Configuração do webhook via API
Criar 1 webhook para a aplicação inteira:
- `POST /v3/webhooks` com `url = https://<dominio>/webhook/asaas`
- Definir `events` para incluir pagamentos e assinaturas conforme necessidade.
- Definir `authToken` forte e validar no backend.

Documentação: https://docs.asaas.com/docs/create-new-webhook-via-api

## 8) Regras de implementação (segurança)

- Toda comunicação com Asaas ocorre no servidor (route handlers/server actions).
- O front nunca recebe tokens Asaas.
- O bloqueio é aplicado no backend por `organizationId`.
- A Billing page continua acessível mesmo bloqueado (para pagar/regularizar).

## 9) Pontos a confirmar antes de implementar

1) A cobrança “válida” para liberar acesso será `PAYMENT_RECEIVED` (e `PAYMENT_CONFIRMED` conta ou não? Em cartão, `PAYMENT_RECEIVED` pode ocorrer depois).
2) Qual valor e plano mensal (fixo por org) e se haverá múltiplos planos.
3) Campos obrigatórios do Customer (CPF/CNPJ, endereço, etc.) para o seu caso.
4) Política de `validUntil`:
   - baseada no `dueDate` pago
   - baseada no `paymentDate`
   - baseada em `nextDueDate`

