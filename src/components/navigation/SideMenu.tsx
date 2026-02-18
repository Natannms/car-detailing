"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { CreditCard, FolderSimple, House, SignOut, UserCircle } from "@phosphor-icons/react";

export function SideMenu() {
  const router = useRouter();
  const clerk = useClerk();

  const logout = async () => {
    await clerk.signOut({ redirectUrl: "/login" });
    router.push("/login");
  };

  return (
    <aside className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-2 px-4 pt-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <span className="text-sm font-semibold">K</span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900">Kanban AI</div>
          <div className="truncate text-xs text-gray-500">Workspace</div>
        </div>
      </div>

      <div className="grid gap-2 px-3">
        <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Menu</div>

        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-white hover:text-gray-900"
        >
          <House size={18} weight="bold" />
          Overview
        </Link>

        <Link
          href="/dashboard/projects"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-white hover:text-gray-900"
        >
          <FolderSimple size={18} weight="bold" />
          Projetos
        </Link>

        <Link
          href="/dashboard/account"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-white hover:text-gray-900"
        >
          <UserCircle size={18} weight="bold" />
          Conta
        </Link>

        <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-400">
          <span className="flex items-center gap-3">
            <CreditCard size={18} weight="bold" />
            Billing
          </span>
          <span className="text-xs">Em breve</span>
        </div>
      </div>

      <div className="mt-auto px-3 pb-3">
        <button
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-white hover:text-gray-900"
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

