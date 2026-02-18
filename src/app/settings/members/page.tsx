"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../../ui/apiClient";

type Member = {
  id: string;
  email: string;
  roles: string[];
  organizationId: string;
};

type Invite = {
  id: string;
  organizationId: string;
  tokenHash: string;
  roleToGrant: "MEMBER" | "ORG_ADMIN";
  emailHint: string | null;
  expiresAt: string;
  usedAt: string | null;
  usedByUserId: string | null;
  createdByUserId: string;
  createdAt: string;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const membersRes = await apiFetch<{ members: Member[] }>("/api/org/members");
      const invitesRes = await apiFetch<{ invites: Invite[] }>("/api/invites");
      setMembers(membersRes.members);
      setInvites(invitesRes.invites);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao carregar membros/convites.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createInvite = async () => {
    setError(null);
    setInviteLink(null);
    try {
      const days = Number(expiresInDays);
      const res = await apiFetch<{ inviteLink: string }>("/api/invites", {
        method: "POST",
        json: {
          emailHint: emailHint.trim() ? emailHint.trim() : null,
          expiresInDays: Number.isFinite(days) ? days : 7,
        },
      });
      setInviteLink(res.inviteLink);
      await load();
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao gerar convite.");
    }
  };

  const revokeInvite = async (id: string) => {
    if (!confirm("Revogar este convite?")) return;
    setError(null);
    try {
      await apiFetch(`/api/invites/${encodeURIComponent(id)}`, { method: "DELETE" });
      setInvites(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao revogar convite.");
    }
  };

  if (loading) return <div>Carregando…</div>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1>Membros</h1>
      {error ? <div style={{ color: "rgb(200,0,0)" }}>{error}</div> : null}

      <section style={{ display: "grid", gap: 8, padding: 12, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
        <h2 style={{ fontSize: 16 }}>Convidar membro</h2>
        <label style={{ display: "grid", gap: 4 }}>
          <span>Email (opcional)</span>
          <input value={emailHint} onChange={e => setEmailHint(e.target.value)} placeholder="membro@empresa.com" />
        </label>
        <label style={{ display: "grid", gap: 4, maxWidth: 220 }}>
          <span>Expira em (dias)</span>
          <input value={expiresInDays} onChange={e => setExpiresInDays(e.target.value)} />
        </label>
        <button type="button" onClick={createInvite}>
          Gerar link de convite
        </button>
        {inviteLink ? (
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ opacity: 0.8 }}>Link gerado:</div>
            <pre style={{ padding: 12, background: "rgba(0,0,0,0.04)", borderRadius: 12, overflowX: "auto" }}>{inviteLink}</pre>
          </div>
        ) : null}
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ fontSize: 16 }}>Membros da Organização</h2>
        <ul style={{ listStyle: "none", display: "grid", gap: 8 }}>
          {members.map(m => (
            <li key={m.id} style={{ padding: 12, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <strong>{m.email}</strong>
                <span style={{ opacity: 0.7, fontSize: 12 }}>{m.roles.join(", ")}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ fontSize: 16 }}>Convites</h2>
        {invites.length === 0 ? <div>Nenhum convite ainda.</div> : null}
        <ul style={{ listStyle: "none", display: "grid", gap: 8 }}>
          {invites.map(i => (
            <li key={i.id} style={{ padding: 12, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12, display: "grid", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <strong>{i.emailHint ?? "Convite genérico"}</strong>
                <button type="button" onClick={() => revokeInvite(i.id)} style={{ color: "rgb(200,0,0)" }}>
                  Revogar
                </button>
              </div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                expira: {new Date(i.expiresAt).toLocaleString()} • usado: {i.usedAt ? new Date(i.usedAt).toLocaleString() : "não"}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

