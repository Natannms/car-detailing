"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetch } from "../ui/apiClient";
import { Button } from "@/components/ui/button";

type Billing = {
  status: "PENDING" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  validUntil: string | null;
};

function isActive(b: Billing | null) {
  if (!b) return false;
  if (b.status !== "ACTIVE") return false;
  if (!b.validUntil) return false;
  const d = new Date(b.validUntil);
  if (isNaN(d.getTime())) return false;
  return d.getTime() >= Date.now();
}

export function BillingGateOverlay() {
  const pathname = usePathname();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const r = await apiFetch<{ billing: Billing | null }>("/api/billing/status");
        setBlocked(!isActive(r.billing));
      } catch {
        setBlocked(true);
      }
    };
    void run();
  }, []);

  if (!blocked) return null;
  if (pathname.startsWith("/dashboard/billing")) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/35 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)] ring-1 ring-border">
        <div className="text-sm font-semibold text-foreground">Acesso bloqueado</div>
        <div className="mt-2 text-sm text-muted-foreground">Finalize o pagamento da assinatura para liberar o uso do sistema.</div>
        <div className="mt-5 flex items-center justify-end">
          <Button asChild className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
            <Link href="/dashboard/billing">Ir para Billing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
