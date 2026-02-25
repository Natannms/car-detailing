import { Suspense } from "react";
import { BillingClient } from "./BillingClient";

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="px-6 py-6 text-sm text-muted-foreground">Carregando…</div>}>
      <BillingClient />
    </Suspense>
  );
}
