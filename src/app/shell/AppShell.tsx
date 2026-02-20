"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import styles from "./AppShell.module.css";
import { clearSession, getSession, type Session } from "../ui/session";

function isPublicPath(pathname: string) {
  return pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/dashboard");
}

function extractProjectId(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "projects") return null;
  return parts[1] ?? null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session>(() => getSession());

  useEffect(() => {
    const onStorage = () => setSession(getSession());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    setSession(getSession());
  }, [pathname]);

  const projectId = useMemo(() => extractProjectId(pathname), [pathname]);

  if (isPublicPath(pathname)) return <>{children}</>;

  const onLogout = async () => {
    getFirebaseAuth()?.signOut();
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    clearSession();
    setSession(getSession());
    router.push("/login");
    router.refresh();
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div>
          <Link className={styles.brand} href="/">
            JiraLike
          </Link>
          {projectId ? <div className={styles.muted}>Projeto: {projectId}</div> : null}
        </div>

        <nav className={styles.nav}>
          <Link className={styles.buttonLink} href="/projects">
            Projetos
          </Link>
          {projectId ? (
            <>
              <Link className={styles.buttonLink} href={`/projects/${projectId}/backlog`}>
                Backlog
              </Link>
              <Link className={styles.buttonLink} href={`/projects/${projectId}/import`}>
                Importar
              </Link>
            </>
          ) : null}
          <Link className={styles.buttonLink} href="/settings/session">
            Sessão
          </Link>
          <button className={`${styles.buttonLink} ${styles.danger}`} type="button" onClick={onLogout}>
            Sair
          </button>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
