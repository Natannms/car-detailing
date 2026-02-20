import { firestore } from "./admin";

async function run() {
  const db = firestore();
  const now = new Date();

  const plans = [
    {
      id: "basic",
      name: "Basic",
      description: "Para empresas com 1 unidade.",
      monthlyPrice: 21.9,
      maxUnits: 1,
      features: ["1 unidade", "Atendimentos WhatsApp", "Agendamentos e pacientes"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "premium",
      name: "Premium",
      description: "Para empresas com até 6 unidades.",
      monthlyPrice: 31.9,
      maxUnits: 6,
      features: ["Até 6 unidades", "Atendimentos WhatsApp", "Agendamentos e pacientes"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Para redes e operações maiores. Fale com um consultor.",
      monthlyPrice: 99.9,
      maxUnits: null,
      features: ["Unidades ilimitadas (sob consulta)", "SLA e onboarding dedicado", "Integrações sob demanda"],
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const p of plans) {
    await db.collection("plans").doc(p.id).set(p, { merge: true });
  }
}

run()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

