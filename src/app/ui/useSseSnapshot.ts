import { useEffect, useRef, useState } from "react";

export function useSseSnapshot<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setError(null);
    setConnected(false);
    setData(null);

    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("ready", () => setConnected(true));
    es.onmessage = event => {
      try {
        setData(JSON.parse(event.data) as T);
      } catch {
        setError("Falha ao ler snapshot.");
      }
    };
    es.onerror = () => {
      setError("Conexão de snapshot falhou.");
      setConnected(false);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [url]);

  return { data, error, connected };
}

