"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "./ui/apiClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then(() => {
        router.replace("/dashboard");
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1>JiraLike</h1>
      <p>Carregando…</p>
      <Link href="/dashboard">Ir para Dashboard</Link>
    </div>
  );
}
