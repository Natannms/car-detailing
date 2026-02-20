/**
 * Seed de atendimento: garante um paciente com attendanceStatus e simula uma thread
 * de mensagens em messageThreads para testar o Kanban e o chat.
 *
 * Uso: npm run firebase:seed:attendance
 *
 * Paciente usado: id 4c66cd09-44e7-444e-8094-5ef587fabf0b (unidade 4303473637, org ghrokrealtime).
 * Cria/atualiza o paciente com attendanceStatus e insere mensagens de exemplo em messageThreads.
 */

import fs from "fs";
import path from "path";
import { firestore } from "../src/infrastructure/firebase/admin";

const PATIENT_ID = "4c66cd09-44e7-444e-8094-5ef587fabf0b";
const ORG_ID = "ghrokrealtime";
const UNIT_ID = "4303473637";

const PATIENT_DATA = {
  id: PATIENT_ID,
  organizationId: ORG_ID,
  unitId: UNIT_ID,
  patientNumber: "00001",
  name: "JOAO",
  email: "agnusnat@hotmail.com",
  phone: "31998888752",
  gender: "MASCULINO",
  age: 45,
  bloodType: "B+",
  treatment: "TERAPIA",
  cpf: "12345678911",
  rg: "17158944",
  address: {
    street: "dsasda",
    district: "asdad",
    city: "Belo Horizonte",
    state: "Acre (AC)",
    number: "99",
  },
  attendanceStatus: "Waiting" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

const CUSTOMER_PHONE = normalizePhone(PATIENT_DATA.phone);

const MESSAGES: { messageText: string; isBot: boolean }[] = [
  { messageText: "Olá! Em que posso ajudar hoje?", isBot: true },
  { messageText: "Oi, gostaria de agendar uma consulta.", isBot: false },
  { messageText: "Claro! Qual especialidade você precisa?", isBot: true },
  { messageText: "Terapia, por favor.", isBot: false },
  { messageText: "Perfeito. Temos horários disponíveis nesta semana. Qual dia prefere?", isBot: true },
  { messageText: "Pode ser quinta-feira?", isBot: false },
  { messageText: "Quinta-feira está disponível. Prefere período da manhã ou tarde?", isBot: true },
  { messageText: "Tarde, por volta das 15h.", isBot: false },
  { messageText: "Anotado. Agendamento provisório: quinta às 15h. Confirma?", isBot: true },
  { messageText: "Sim, confirmo. Obrigado!", isBot: false },
];

function loadEnvVars(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env");
  const out: Record<string, string> = { ...process.env } as Record<string, string>;
  if (!fs.existsSync(envPath)) return out;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

async function main() {
  const db = firestore();
  const now = new Date();

  console.info("Atualizando paciente com attendanceStatus...");
  await db.collection("patients").doc(PATIENT_ID).set(
    {
      ...PATIENT_DATA,
      updatedAt: now,
    },
    { merge: true },
  );
  console.info("  Paciente", PATIENT_ID, "-> attendanceStatus:", PATIENT_DATA.attendanceStatus);

  console.info("Inserindo mensagens de simulação em messageThreads...");
  const col = db.collection("messageThreads");
  let baseTime = Date.now() - MESSAGES.length * 2 * 60 * 1000;
  for (let i = 0; i < MESSAGES.length; i++) {
    const msg = MESSAGES[i]!;
    const createdAt = new Date(baseTime + i * 2 * 60 * 1000);
    const updatedAt = new Date(baseTime + i * 2 * 60 * 1000 + 1000);
    await col.add({
      customerPhone: CUSTOMER_PHONE,
      isBot: msg.isBot,
      messageText: msg.messageText,
      organizationId: ORG_ID,
      unit_id: UNIT_ID,
      createdAt,
      updatedAt,
    });
  }
  console.info("  ", MESSAGES.length, "mensagens inseridas (customerPhone:", CUSTOMER_PHONE + ")");

  console.info("\nSeed de atendimento concluído.");
  console.info("  Paciente:", PATIENT_DATA.name, "| Telefone:", PATIENT_DATA.phone);
  console.info("  Unidade:", UNIT_ID, "| Org:", ORG_ID);
  console.info("  Na tela Atendimentos, selecione a unidade", UNIT_ID, "e o card do JOAO deve aparecer na coluna Aguardando atendimento.");
  console.info("  Clique no card para abrir o chat e ver o histórico de mensagens.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
