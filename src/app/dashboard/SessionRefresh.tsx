"use client";

import { useEffect, useRef } from "react";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

/**
 * Mantém o cookie de sessão em dia: quando o Firebase Auth tem usuário logado,
 * reenvia o idToken para POST /api/auth/session e renova o cookie HttpOnly.
 * Assim o usuário só é deslogado ao clicar em Sair.
 */
export function SessionRefresh() {
  const refreshedRef = useRef(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user || refreshedRef.current) return;
      try {
        const idToken = await user.getIdToken(true);
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
          credentials: "same-origin",
        });
        if (res.ok) refreshedRef.current = true;
      } catch {
        // ignora falha de rede; o cookie atual ainda vale até expirar
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
