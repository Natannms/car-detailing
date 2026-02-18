📚 VISÃO GERAL DO BACKLOG

Hierarquia ideal:

EPIC
 └── STORY
      ├── TASK
      │    └── SUBTASK
      └── BUG (quando aplicável)

## IMPORTANTE
Os exemplos contidos no guia são somente exemplos e guia para construçãod e backlog, e o contexto de delivery nao representa as soluções que serão criadas no projeto.
O BACKLOG deve ser construindo gerando relacionamento de cards que tenham correlção sempre, de forma que tarefas sejam executadas afim de completar uma historia ou um epico 100%, de forma que enquanto um epico não for completado ou nenhuma historia dentro dele não for completada, as tarefas ainda precisam ser completadas até que o epico ou a historia sejam considerados completos.


🟣 1. EPIC — O CONTEXTO DE NEGÓCIO
🎯 O que é?

Um grande objetivo de negócio que gera valor claro.

Não é técnico.
Não é implementação.
É propósito.

🧠 Estrutura ideal de um EPIC
1️⃣ Título

Formato:

[DOMÍNIO] - Resultado de Negócio Claro

Exemplo:
[Pedidos] - Fluxo completo de fechamento e pagamento via WhatsApp

2️⃣ Descrição

Dividir em 5 blocos:

1. Contexto

Por que isso existe?

2. Problema atual

Qual dor estamos resolvendo?

3. Resultado esperado

Qual mudança deve acontecer?

4. Métricas de sucesso

Como sabemos que deu certo?

5. Fora do escopo

O que NÃO está incluso?

🧩 Exemplo 

EPIC:

[Pedidos] - Automatizar criação e pagamento de pedidos via WhatsApp


Descrição:

Contexto
Atualmente os pedidos são feitos manualmente via WhatsApp, gerando erros e atrasos.

Problema atual

Erro na digitação

Demora na resposta

Falta de controle de status

Resultado esperado
Criar fluxo automatizado de:

Adição de itens

Confirmação

Geração de cobrança

Atualização de status

Métricas

Redução de 40% no tempo de atendimento

Zero erros de cálculo manual

95% dos pedidos com status rastreável

Fora do escopo

Integração com marketplaces externos

Programa de fidelidade

🧠 Regras de Ouro de EPIC

✅ Não fala como será feito
✅ Não cita banco de dados
✅ Não cita tecnologia
✅ Foca em valor

🟢 2. STORY — A UNIDADE DE VALOR

Aqui entra a famosa estrutura que você mencionou.

🎯 O que é?

Uma entrega pequena e testável que gera valor.

📐 Padrão oficial (User Story)
Eu como <tipo de usuário>
Quero <ação ou funcionalidade>
Para <benefício ou objetivo>

📌 Estrutura ideal de uma STORY no JIRA
1️⃣ Título

Formato:

[Contexto] - Ação principal


Exemplo:

[Pedidos] - Permitir adicionar item ao carrinho

2️⃣ Descrição

Dividir em:

User Story

Regras de negócio

Critérios de aceite

Dependências (se houver)

Observações técnicas (mínimas)

🎯 Exemplo completo

User Story

Eu como Cliente do restaurante
Quero adicionar itens ao meu pedido
Para montar minha compra antes de finalizar


Regras de negócio

O sistema deve permitir múltiplos itens

Quantidade mínima 1

Não permitir adicionar produto inativo

Calcular subtotal automaticamente

Critérios de aceite (BDD)

Formato recomendado:

Dado que <contexto>
Quando <ação>
Então <resultado esperado>


Exemplo:

Dado que estou no fluxo de pedido

Quando adiciono 2 unidades de Pizza

Então o subtotal deve ser atualizado corretamente

🔥 Regra de ouro para STORY

Deve ser possível desenvolver, testar e deployar essa história sozinha.

Se depender de outra, ela está mal quebrada.

🔵 3. TASK — COMO SERÁ FEITO
🎯 O que é?

Implementação técnica da Story.

Exemplos:

Criar endpoint

Criar tabela

Implementar serviço

Criar componente

📐 Estrutura ideal
Título:
Criar endpoint POST /orders

Descrição:

Implementar rota

Validar payload

Integrar com Service

Retornar status apropriado

Importante:

TASK NÃO tem:

Eu como usuário...
Ela é técnica.

🟡 4. SUBTASK — PASSOS PEQUENOS

Subtask é granular.

Exemplos:

Criar migration

Criar interface OrderRepository

Implementar método Save()

Criar testes unitários

Regra de Ouro:

Se a TASK pode ser feita em menos de 1 dia, talvez não precise de Subtask.

🔴 5. BUG — Correção

Bug tem estrutura diferente.

📐 Estrutura ideal de BUG
Título:
[Pedidos] - Subtotal calculado incorretamente ao remover item

Descrição deve conter:

Ambiente

Passos para reproduzir

Resultado atual

Resultado esperado

Evidências (print, log)

Exemplo:

Passos para reproduzir

Criar pedido

Adicionar 2 pizzas

Remover 1

Ver subtotal

Resultado atual
Subtotal permanece igual.

Resultado esperado
Subtotal deve recalcular.