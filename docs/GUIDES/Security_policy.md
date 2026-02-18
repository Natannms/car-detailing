# SECURITY POLICY GUIDE

## 🎯 OBJETIVO

Garantir que o projeto siga um padrão mínimo obrigatório de segurança em:

- API
- Frontend
- Banco de dados
- Autenticação
- Configuração de ambiente

Essa política é obrigatória e deve ser seguida por qualquer implementação nova ou refatoração.

---

# 🛡 1. PRINCÍPIOS FUNDAMENTAIS

1. Nunca confiar em dados do cliente
2. Validar toda entrada
3. Sanitizar antes de persistir
4. Nunca expor stacktrace em produção
5. Nunca versionar segredos
6. Aplicar menor privilégio possível

---

# 🔐 2. AUTENTICAÇÃO

- Tokens devem ter expiração
- Tokens nunca devem conter dados sensíveis
- Nunca armazenar JWT no localStorage (se aplicável)
- Refresh token deve ser seguro
- Sempre validar assinatura do token

---

# 🔎 3. VALIDAÇÃO DE DADOS

- Toda entrada externa deve ser validada
- Nunca confiar apenas em validação do frontend
- Validar:
  - Tipo
  - Formato
  - Limite de tamanho
  - Enum permitido
- Rejeitar dados inválidos explicitamente

---

# 💉 4. PREVENÇÃO DE INJECTION

- Nunca montar queries com string concatenada
- Sempre usar parâmetros preparados
- ORM não remove responsabilidade de validação
- Evitar eval()
- Evitar Function constructor

---

# 🧱 5. SEGREDOS E CONFIGURAÇÃO

- Nunca versionar:
  - .env
  - chaves privadas
  - tokens
- Sempre usar variáveis de ambiente
- Nunca imprimir secrets em logs

---

# 📁 6. CONTROLE DE ACESSO

- Validar permissões por role
- Nunca confiar apenas em ID enviado pelo cliente
- Checar ownership antes de retornar dados
- Multi-tenancy deve validar organizationId sempre

---

# 🚨 7. TRATAMENTO DE ERROS

- Nunca retornar erro técnico completo
- Nunca retornar stacktrace
- Mensagens devem ser genéricas para o usuário
- Logs detalhados somente no servidor

---

# 🧪 8. TESTES DE SEGURANÇA MÍNIMOS

Toda feature sensível deve conter testes que validem:

- Acesso não autorizado
- Dados inválidos
- Permissão incorreta
- Injection simples

---

# ❌ BLOQUEIOS AUTOMÁTICOS

Implementações devem ser bloqueadas se:

- Usarem console.log para imprimir dados sensíveis
- Usarem query string concatenada
- Exibirem erro técnico na resposta HTTP
- Salvarem secrets hardcoded

---

# 🧠 CONSIDERAÇÕES FINAIS

Segurança não é opcional.

Qualquer implementação que viole essas regras deve ser recusada.
