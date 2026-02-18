import { execSync } from "child_process";
import fs from "fs";

const MAX_LINES = 800;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "coverage") continue;
    const fullPath = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

try {
  const isCi = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
  const changedFiles = isCi
    ? walk("src").filter(file => file.endsWith(".ts") || file.endsWith(".tsx"))
    : execSync("git diff --cached --name-only")
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
