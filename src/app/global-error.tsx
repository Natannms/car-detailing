"use client";

/**
 * Página de erro global. Substitui o root layout quando ativo.
 * Deve ser mínima e NÃO usar hooks que dependem de contexto (useContext, ThemeProvider, etc.),
 * pois durante o build do Next.js a árvore de React pode não estar disponível.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1>Algo deu errado</h1>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>{error.message}</p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: "pointer",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
