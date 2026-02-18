"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { clearSession, getSession } from "../../ui/session";
import { apiFetch } from "../../ui/apiClient";

export default function SessionPage() {
  const clerk = useClerk();
  const [session, setSession] = useState(() => getSession());
  const [me, setMe] = useState<{ id: string; email: string; roles: string[]; organizationId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ user: { id: string; email: string; roles: string[]; organizationId: string } }>("/api/auth/me")
      .then(r => setMe(r.user))
      .catch(() => setMe(null));
  }, []);

  const logout = async () => {
    setError(null);
    try {
      await clerk.signOut({ redirectUrl: "/login" });
    } catch (e) {
      setError("Erro ao sair.");
    } finally {
      clearSession();
      setSession(getSession());
      window.location.href = "/login";
    }
  };

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 900 }}>
      <h1>Sessão</h1>
      {error ? <div style={{ color: "rgb(200,0,0)" }}>{error}</div> : null}
      <div style={{ display: "grid", gap: 8 }}>
        <div>
          <strong>Usuário:</strong> {me ? me.email : "não autenticado"}
        </div>
        {me ? (
          <div style={{ opacity: 0.8, fontSize: 12 }}>
            {me.id} • {me.organizationId} • {me.roles.join(", ")}
          </div>
        ) : null}
        {session.lastProjectId ? (
          <div>
            <strong>Último projeto:</strong> <Link href={`/projects/${session.lastProjectId}/backlog`}>{session.lastProjectId}</Link>
          </div>
        ) : null}
      </div>

      <section style={{ display: "grid", gap: 8, padding: 12, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
        <h2 style={{ fontSize: 16 }}>Ações</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={logout} style={{ color: "rgb(200,0,0)" }}>
            Sair
          </button>
          <Link href="/settings/members">Membros</Link>
          <Link href="/login">Ir para Login</Link>
        </div>
      </section>
    </div>
  );
}
