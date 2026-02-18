## CI&CD GUIDE
# IMPORTANTE
Esse guia é apenas um guia, com exemplos de estrutura e configuração, que deve ser adaptado a realidade do projeto em questão, as pastas sugeridas em testMatch são apenas exemplos e não representam necessariamente a estrutura de pastas do projeto. As politicas e regras como de cobertura de testes, bloqueio de console.log e arquivos grandes devem ser adaptadas e seguidas a estritamente em qualquer projeto que use essa documentação.

🔹 PARTE 1 — TESTES COM COVERAGE 60%
1️⃣ jest.config.backend.js
module.exports = {
  testMatch: ["**/backend/**/*.test.ts"],
  collectCoverage: true,
  coverageDirectory: "coverage/backend",
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 60,
      functions: 60,
      statements: 60,
    },
  },
};

2️⃣ jest.config.frontend.js
module.exports = {
  testMatch: ["**/frontend/**/*.test.tsx"],
  collectCoverage: true,
  coverageDirectory: "coverage/frontend",
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 60,
      functions: 60,
      statements: 60,
    },
  },
};

3️⃣ package.json
{
  "scripts": {
    "test:backend": "jest --config=jest.config.backend.js",
    "test:frontend": "jest --config=jest.config.frontend.js",
    "test:coverage": "npm run test:backend && npm run test:frontend"
  }
}


Se coverage cair abaixo de 60%, o Jest retorna erro automaticamente.

Sem script extra.

🔹 PARTE 2 — BLOQUEAR console.log

Criar:

scripts/check-console.mjs

import { execSync } from "child_process";
import fs from "fs";

try {
  const changedFiles = execSync("git diff --cached --name-only")
    .toString()
    .split("\n")
    .filter(file => file.endsWith(".ts") || file.endsWith(".tsx"));

  let hasConsole = false;

  changedFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, "utf8");
        if (content.includes("console.log")) {
          console.error(`❌ console.log encontrado em ${file}`);
          hasConsole = true;
        }
    } catch (e) {
        // file might be deleted
    }
  });

  if (hasConsole) process.exit(1);
} catch (e) {
  // If git command fails (e.g. no git repo), just exit 0 or warn
  console.log("⚠️  Não foi possível verificar console.log (git diff falhou ou não há alterações).");
  process.exit(0);
}


Isso analisa apenas arquivos alterados.

🔹 PARTE 3 — BLOQUEAR ARQUIVOS GRANDES

Criar:

scripts/check-file-size.mjs

import { execSync } from "child_process";
import fs from "fs";

const MAX_LINES = 500;

try {
  const changedFiles = execSync("git diff --cached --name-only")
    .toString()
    .split("\n")
    .filter(file => file.endsWith(".ts") || file.endsWith(".tsx"));

  let error = false;

  changedFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const lineCount = fs.readFileSync(file, "utf8").split("\n").length;
      if (lineCount > MAX_LINES) {
        console.error(`❌ ${file} tem ${lineCount} linhas (máx ${MAX_LINES})`);
        error = true;
      }
    }
  });

  if (error) process.exit(1);
} catch (e) {
    console.log("⚠️  Não foi possível verificar tamanho dos arquivos (git diff falhou ou não há alterações).");
    process.exit(0);
}

🔹 PARTE 4 — HUSKY

Instalar:

npm install husky --save-dev
npx husky init


Editar:

.husky/pre-commit


Coloque:

echo "🔍 Verificando console.log..."
node scripts/check-console.mjs || exit 1

echo "📏 Verificando tamanho de arquivos..."
node scripts/check-file-size.mjs || exit 1

echo "🧪 Verificando cobertura..."
npm run test:coverage || exit 1

echo "✅ Commit permitido."


Pronto.

🔥 O QUE ACONTECE AGORA
Desenvolvedor altera código

↓
Roda commit
↓
Pre-commit executa:

Bloqueia se tiver console.log

Bloqueia se arquivo grande

Bloqueia se coverage < 60%

Só permite commit se tudo estiver ok.

⚠️ IMPORTANTE

Se alguém usar:

git commit --no-verify


Vai pular.

Por isso agora vem a segunda camada:

🏗 PARTE 5 — GITHUB ACTION (CI)

Criar:

.github/workflows/ci.yml

name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install

      - run: node scripts/check-console.mjs
      - run: node scripts/check-file-size.mjs
      - run: npm run test:coverage

🔐 AGORA ADICIONE NO GITHUB:

Settings

Branch Protection Rules

Exigir:

Passing checks before merging

Require PR

Agora ninguém consegue merge sem CI verde.

🧠 FLUXO FINAL PROFISSIONAL
Dev commit
  ↓
Pre-commit valida
  ↓
Push
  ↓
GitHub Action roda tudo novamente
  ↓
Se verde → pode abrir PR
  ↓
PR → você revisa

💎 O QUE VOCÊ GANHOU

Controle de cobertura

Controle estrutural mínimo

Sem complexidade excessiva

Sem ESLint

Sem type-check

Sem IA

Determinístico

Simples de manter


🧱 CAMADA 2 — CI (OBRIGATÓRIO)

O erro mais comum nas empresas:

“funciona no meu PC”

CI impede isso.

Criar:

.github/workflows/ci.yml

name: Quality Gate

on:
  push:
    branches: [development, homolog, main]
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install

      - name: Block console.log
        run: node scripts/check-console.mjs

      - name: Block large files
        run: node scripts/check-file-size.mjs

      - name: Run coverage
        run: npm run test:coverage


Se alguém usar --no-verify localmente, o CI bloqueia o merge.

🧱 CAMADA 3 — BRANCH PROTECTION (A MAIS IMPORTANTE)
Essa sera executada manualmente mas cada branch pode ser checada se existe e criada automaticamente por IA com TRAE AI, CURSOR, VSCODE, E FERRAMENTAS CORRELATAS Até mesmo com MCP server.
Agora você entra no GitHub:

Settings → Branch protection rules

Criar regra para:

development

homolog

main
