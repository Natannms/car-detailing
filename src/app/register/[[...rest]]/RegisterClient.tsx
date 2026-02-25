"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Plan = { id: string; name: string; description: string; monthlyPrice: number | null };

export function RegisterClient({ inviteToken, planId }: { inviteToken: string; planId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (!planId) return;
    let cancelled = false;
    fetch("/api/plans")
      .then(r => r.json())
      .then((data: { plans?: Plan[] }) => {
        if (cancelled) return;
        const plan = (data.plans ?? []).find(p => p.id === planId);
        if (plan) setSelectedPlan(plan);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const createSessionAndRedirect = async (idToken: string) => {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      credentials: "same-origin",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error?.message ?? "Erro ao criar sessão.");
      return false;
    }
    if (inviteToken) {
      await fetch(`/api/invites/token/${encodeURIComponent(inviteToken)}/redeem`, { method: "POST", credentials: "same-origin" });
    }
    if (inviteToken) {
      router.push("/dashboard/invite");
    } else if (planId) {
      router.push(`/dashboard/billing?plan=${encodeURIComponent(planId)}`);
    } else {
      router.push("/dashboard");
    }
    router.refresh();
    return true;
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setLoading(true);
    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Configure no .env: NEXT_PUBLIC_FIREBASE_API_KEY e NEXT_PUBLIC_FIREBASE_PROJECT_ID (Firebase Console > Configurações do projeto > Seus apps > Web).");
      setLoading(false);
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const idToken = await userCred.user.getIdToken();
      await createSessionAndRedirect(idToken);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "code" in err ? (err as { code?: string }).code : null;
      if (msg === "auth/popup-closed-by-user") setError(null);
      else setError("Erro ao continuar com Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Configure no .env: NEXT_PUBLIC_FIREBASE_API_KEY e NEXT_PUBLIC_FIREBASE_PROJECT_ID (Firebase Console > Configurações do projeto > Seus apps > Web).");
      setLoading(false);
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não encontrado após registro.");
      const idToken = await user.getIdToken();
      await createSessionAndRedirect(idToken);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "code" in err ? (err as { code?: string }).code : null;
      if (msg === "auth/email-already-in-use") setError("Este email já está em uso.");
      else setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop"
            alt="Trabalho em equipe"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

          <div className="absolute left-10 top-10 flex items-center gap-2 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/15">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </div>
            <div className="text-sm font-semibold tracking-wide">Marca AI</div>
          </div>

          <div className="absolute bottom-12 left-12 right-12 text-white">
            <div className="max-w-md">
              <p className="text-2xl font-semibold leading-snug tracking-tight">“Centralize seus projetos e colabore com o time em um único lugar.”</p>
              <div className="mt-5">
                <div className="text-sm font-semibold">Equipe Marca AI</div>
                <div className="text-xs text-white/75">Workspace interno</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center bg-[#EEF1F6] px-6 py-12 lg:bg-white lg:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">Crie sua conta</h1>
              <p className="mt-2 text-sm text-gray-600">Crie sua conta para começar a usar o Marca AI.</p>
              {selectedPlan ? (
                <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Plano selecionado</div>
                  <div className="mt-1 font-semibold text-gray-900">{selectedPlan.name}</div>
                  <div className="mt-1 text-xs text-gray-600">{selectedPlan.description}</div>
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="mt-2 h-11 rounded-xl border-gray-300 bg-white px-4 text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-700">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="mt-2 h-11 rounded-xl border-gray-300 bg-white px-4 text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" disabled={loading} className="w-full rounded-full">
                {loading ? "Criando…" : "Criar conta"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#EEF1F6] px-2 text-gray-500 lg:bg-white">ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={handleGoogleSignUp}
                className="w-full rounded-full border-gray-300 bg-white"
              >
                Criar conta com Google
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Já tem conta?{" "}
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

