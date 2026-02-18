"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/app/ui/apiClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@phosphor-icons/react";

type CreateClientPayload = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  companyName?: string | null;
  notes?: string | null;
};

export default function NewClientPage() {
  const router = useRouter();
  const search = useSearchParams();
  const returnTo = useMemo(() => search.get("returnTo") || "/dashboard/projects", [search]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const normalize = (v: string) => (v.trim() ? v.trim() : null);

  const submit = async () => {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nome é obrigatório.");
      return;
    }

    const payload: CreateClientPayload = {
      name: trimmedName,
      email: normalize(email),
      phone: normalize(phone),
      address: normalize(address),
      instagram: normalize(instagram),
      linkedin: normalize(linkedin),
      companyName: normalize(companyName),
      notes: normalize(notes),
    };

    setSaving(true);
    try {
      await apiFetch("/api/clients", { method: "POST", json: payload });
      router.push(returnTo);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.status} ${e.code}: ${e.message}`);
      else setError("Erro ao cadastrar cliente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Link href={returnTo} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <ArrowLeft size={18} weight="bold" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Cadastrar cliente</h1>
              <p className="mt-1 text-sm text-gray-600">Crie um cliente para vincular aos projetos.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl bg-white" onClick={() => router.push(returnTo)} disabled={saving}>
            Cancelar
          </Button>
          <Button className="rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700" onClick={submit} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Nome *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Telefone</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Nome da empresa</label>
            <input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Endereço (opcional)</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Instagram</label>
            <input
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              placeholder="@cliente"
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">LinkedIn</label>
            <input
              value={linkedin}
              onChange={e => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Observações</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

