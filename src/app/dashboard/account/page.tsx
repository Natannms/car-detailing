import { Suspense } from "react";
import { AccountClient } from "./accountClient";

export default function DashboardAccountPage() {
  return (
    <Suspense fallback={<div>Carregando…</div>}>
      <AccountClient />
    </Suspense>
  );
}
