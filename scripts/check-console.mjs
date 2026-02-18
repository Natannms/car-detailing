import { execSync } from "child_process";
import fs from "fs";

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
