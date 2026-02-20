"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/app/ui/apiClient";
import { Button } from "@/components/ui/button";

type Unit = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
};

export function UnitsClient() {
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<{ roles: string[]; unitId: string | null } | null>(null);
  const isAdmin = Boolean(me?.roles?.includes("ORG_ADMIN"));

  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [savingUnit, setSavingUnit] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const [meRes, unitsRes] = await Promise.all([
        apiFetch<{ user: { roles: string[]; unitId: string | null } }>("/api/auth/me"),
        apiFetch<{ units: Unit[] }>("/api/units"),
      ]);
      setMe(meRes.user);
      setUnits(unitsRes.units ?? []);
      setSelectedUnitId(meRes.user.unitId ?? "");
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao carregar unidades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const selectedUnit = useMemo(() => units.find(u => u.id === selectedUnitId) ?? null, [units, selectedUnitId]);

  const saveCurrentUnit = async () => {
    if (!selectedUnitId) return;
    setError(null);
    setSavingUnit(true);
    try {
      await apiFetch("/api/users/me/unit", { method: "PUT", json: { unitId: selectedUnitId } });
      await load();
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao selecionar unidade.");
    } finally {
      setSavingUnit(false);
    }
  };

  const createUnit = async () => {
    setError(null);
    const n = name.trim();
    if (!n) {
      setError("Nome é obrigatório.");
      return;
    }
    setCreating(true);
    try {
      await apiFetch("/api/units", {
        method: "POST",
        json: { name: n, phone: phone.trim() ? phone.trim() : null, address: address.trim() ? address.trim() : null },
      });
      setName("");
      setPhone("");
      setAddress("");
      await load();
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao criar unidade.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Unidades</h1>
        <p className="text-sm text-muted-foreground">Cadastre e selecione a unidade ativa para ver dados no sistema.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="grid gap-4">
          <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="h-5 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-11 w-40 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="mt-4 h-16 w-full animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
          </section>
          <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
            <div className="mb-4 h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-11 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="h-11 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="mt-4 h-11 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 h-10 w-32 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          </section>
        </div>
      ) : null}

      {!loading ? (
        <>
          <section className="grid gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-semibold text-foreground">Unidade ativa</div>
              {isAdmin ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <select
                    value={selectedUnitId}
                    onChange={e => setSelectedUnitId(e.target.value)}
                    className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Selecione</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <Button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => void saveCurrentUnit()} disabled={savingUnit}>
                    {savingUnit ? "Salvando…" : "Definir unidade"}
                  </Button>
                </div>
              ) : null}
            </div>

            {selectedUnit ? (
              <div className="rounded-2xl border border-border bg-muted px-4 py-4 text-sm text-foreground">
                <div className="font-semibold text-foreground">{selectedUnit.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{selectedUnit.phone ?? "—"} • {selectedUnit.address ?? "—"}</div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-muted px-4 py-4 text-sm text-muted-foreground">Nenhuma unidade selecionada.</div>
            )}
          </section>

          {isAdmin ? (
        <section className="grid gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <div className="text-sm font-semibold text-foreground">Cadastrar unidade</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Nome *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Telefone</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Endereço</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-end">
            <Button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => void createUnit()} disabled={creating}>
              {creating ? "Criando…" : "Criar unidade"}
            </Button>
          </div>
        </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

