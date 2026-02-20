"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { Buildings, Calendar, CreditCard, House, Kanban, SignOut, Stethoscope, UsersThree } from "@phosphor-icons/react";

export function SideMenu() {
  const router = useRouter();

  const logout = async () => {
    getFirebaseAuth()?.signOut();
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-2 px-4 pt-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-sm">
          <span className="text-sm font-semibold">MC</span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">Marca AI</div>
          <div className="truncate text-xs text-muted-foreground">Workspace</div>
        </div>
      </div>

      <div className="grid gap-2 px-3">
        <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Menu</div>

        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <House size={18} weight="bold" />
          Overview
        </Link>

        <Link
          href="/dashboard/kanban"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Kanban size={18} weight="bold" />
          Atendimentos
        </Link>

        <Link
          href="/dashboard/patients"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <UsersThree size={18} weight="bold" />
          Pacientes
        </Link>

        <Link
          href="/dashboard/appointments"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Calendar size={18} weight="bold" />
          Agendamentos
        </Link>

        <Link
          href="/dashboard/doctors"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Stethoscope size={18} weight="bold" />
          Médicos
        </Link>

        <Link
          href="/dashboard/units"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Buildings size={18} weight="bold" />
          Unidades
        </Link>

        <Link
          href="/dashboard/billing"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <CreditCard size={18} weight="bold" />
          Billing
        </Link>
      </div>

      <div className="mt-auto px-3 pb-3">
        <button
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
          type="button"
          onClick={logout}
        >
          <SignOut size={18} weight="bold" />
          Logout
        </button>
      </div>
    </aside>
  );
}
