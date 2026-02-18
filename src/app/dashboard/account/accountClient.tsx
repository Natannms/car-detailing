"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../../ui/apiClient";

type Me = {
  id: string;
  email: string;
  roles: string[];
  organizationId: string;
};

export function AccountClient() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [me, setMe] = useState<Me | null>(null);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "redeeming" | "ok" | "error">("idle");

  useEffect(() => {
    apiFetch<{ user: Me }>("/api/auth/me")
      .then(r => setMe(r.user))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (!inviteToken) return;
    setInviteStatus("redeeming");
    apiFetch(`/api/invites/token/${encodeURIComponent(inviteToken)}/redeem`, { method: "POST" })
      .then(() => setInviteStatus("ok"))
      .catch(() => setInviteStatus("error"));
  }, [inviteToken]);

  return (
    <div className="grid gap-3">
      <h1>Conta</h1>
      {inviteToken ? (
        <div className="rounded-xl border bg-card p-3 text-sm">
          {inviteStatus === "redeeming" ? "Aplicando convite…" : null}
          {inviteStatus === "ok" ? "Convite aplicado com sucesso." : null}
          {inviteStatus === "error" ? "Não foi possível aplicar o convite." : null}
        </div>
      ) : null}
      {me ? (
        <div className="grid gap-2">
          <div>
            <strong>Email:</strong> {me.email}
          </div>
          <div>
            <strong>Roles:</strong> {me.roles.join(", ")}
          </div>
          <div className="text-muted-foreground text-xs">
            {me.id} • {me.organizationId}
          </div>
        </div>
      ) : (
        <div>Carregando…</div>
      )}
    </div>
  );
}

