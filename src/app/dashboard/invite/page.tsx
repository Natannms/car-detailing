"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/app/ui/apiClient";
import { Button } from "@/components/ui/button";
import { X } from "@phosphor-icons/react";

export default function DashboardInvitePage() {
  const router = useRouter();
  const search = useSearchParams();
  const token = useMemo(() => search.get("invite") || "", [search]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<{ name: string; email: string; phone: string | null; gender: string | null } | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"" | "MASCULINO" | "FEMININO" | "OUTRO">("");

  useEffect(() => {
    const run = async () => {
      if (!token) {
        router.replace("/dashboard");
        return;
      }
      try {
        await apiFetch("/api/doctor-invites/redeem", { method: "POST", json: { token } });
        const data = await apiFetch<{ doctor: { name: string; email: string; phone: string | null; gender: string | null } }>("/api/doctors/me");
        setDoctor(data.doctor);
        setName(data.doctor.name ?? "");
        setPhone(data.doctor.phone ?? "");
        setGender((data.doctor.gender ?? "") as any);
      } catch (e) {
        if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
        else setError("Não foi possível concluir o convite.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [router, token]);

  const submit = async () => {
    setError(null);
    const n = name.trim();
    if (!n) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/doctors/me", {
        method: "PUT",
        json: { name: n, phone: phone.trim() ? phone.trim() : null, gender: gender ? gender : null },
      });
      router.replace("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Não foi possível salvar seus dados.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-56px)] place-items-center px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div className="text-sm font-semibold text-foreground">Finalizar cadastro</div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => router.replace("/dashboard")}
            aria-label="Fechar"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="px-5 py-5">
          {loading ? <div className="text-sm text-muted-foreground">Carregando…</div> : null}
          {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          {!loading && doctor ? (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail</div>
                <div className="mt-1 font-semibold text-foreground">{doctor.email}</div>
                <div className="mt-1 text-xs text-muted-foreground">A especialidade será configurada pelo administrador.</div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Nome *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Telefone</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Gênero</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">—</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" className="rounded-xl bg-card" onClick={() => router.replace("/dashboard")} disabled={saving}>
                  Agora não
                </Button>
                <Button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => void submit()} disabled={saving}>
                  {saving ? "Salvando…" : "Salvar"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
