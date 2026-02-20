/**
 * Script para limpar e excluir TODAS as coleções do Firestore da conexão atual.
 * Uso: npm run firebase:reset-all
 *
 * Lista dinamicamente todas as coleções de primeiro nível (db.listCollections())
 * e faz recursiveDelete em cada uma — inclui qualquer coleção que exista no
 * projeto/conexão, não só as do app em desenvolvimento.
 *
 * Requer GOOGLE_SERVICE_ACCOUNT no .env (mesmo formato usado pelo app).
 * ATENÇÃO: Esta operação é irreversível. Todos os documentos serão apagados.
 */

import { firestore } from "../src/infrastructure/firebase/admin";

async function main() {
  console.info("Firestore: listando e limpando todas as coleções da conexão...\n");

  const db = firestore();

  const collections = await db.listCollections();
  if (collections.length === 0) {
    console.info("Nenhuma coleção encontrada. Banco já está vazio.");
    return;
  }

  console.info(`Encontradas ${collections.length} coleção(ões):\n`);

  for (const colRef of collections) {
    const id = colRef.id;
    try {
      await db.recursiveDelete(colRef);
      console.info(`  ${id}: limpa.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NOT_FOUND") || msg.includes("does not exist")) {
        console.info(`  ${id}: (inexistente, ignorando)`);
      } else {
        console.error(`  ${id}: ERRO - ${msg}`);
      }
    }
  }

  console.info("\nConcluído. Todas as coleções da conexão foram limpas.");
}

main().catch(err => {
  console.error("Falha ao executar reset:", err);
  process.exit(1);
});
