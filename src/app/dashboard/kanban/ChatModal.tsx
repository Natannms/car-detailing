"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/app/ui/apiClient";
import { X } from "@phosphor-icons/react";

export type MessageThreadItem = {
  id: string;
  customerPhone: string;
  isBot: boolean;
  messageText: string;
  organizationId: string;
  unit_id: string | null;
  createdAt: string;
  updatedAt: string;
};

type PatientForChat = {
  id: string;
  name: string;
  phone: string | null;
  attendanceStatus: string | null;
};

function normalizePhone(phone: string | null): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

function formatTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function ChatModal({
  patient,
  onClose,
}: {
  patient: PatientForChat;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<MessageThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = patient.attendanceStatus === "InProgress";

  const loadThread = useCallback(async () => {
    const phone = normalizePhone(patient.phone) || patient.phone;
    if (!phone) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ messages: MessageThreadItem[] }>(
        `/api/chat/thread?customerPhone=${encodeURIComponent(phone)}`,
      );
      setMessages(res.messages ?? []);
    } catch (e) {
      setMessages([]);
      if (e instanceof ApiError) setError(e.message);
      else setError("Erro ao carregar conversa.");
    } finally {
      setLoading(false);
    }
  }, [patient.phone]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  const send = async () => {
    const text = inputText.trim();
    if (!text || !canSend || sending) return;
    setSending(true);
    setError(null);
    try {
      await apiFetch("/api/chat/send", { method: "POST", json: { patientId: patient.id, messageText: text } });
      setInputText("");
      await loadThread();
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div className="relative flex h-[min(80vh,600px)] w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div className="truncate font-semibold text-foreground">{patient.name}</div>
            <div className="truncate text-sm text-muted-foreground">{patient.phone ?? "—"}</div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="space-y-4">
              <div className="flex justify-start">
                <div className="h-10 w-48 max-w-[85%] animate-pulse rounded-2xl rounded-bl-md bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="flex justify-end">
                <div className="h-10 w-56 max-w-[85%] animate-pulse rounded-2xl rounded-br-md bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="flex justify-start">
                <div className="h-10 w-40 max-w-[85%] animate-pulse rounded-2xl rounded-bl-md bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="flex justify-end">
                <div className="h-12 w-64 max-w-[85%] animate-pulse rounded-2xl rounded-br-md bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="flex justify-start">
                <div className="h-10 w-36 max-w-[85%] animate-pulse rounded-2xl rounded-bl-md bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">Nenhuma mensagem ainda.</div>
          ) : (
            messages.map(m => (
              <div
                key={m.id}
                className={["flex", m.isBot ? "justify-end" : "justify-start"].join(" ")}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                    m.isBot
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md",
                  ].join(" ")}
                >
                  <div>{m.messageText}</div>
                  <div className={["mt-1 text-[10px] opacity-80", m.isBot ? "text-right" : "text-left"].join(" ")}>
                    {formatTime(m.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {error ? (
          <div className="border-t border-border bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>
        ) : null}

        <div className="border-t border-border p-3">
          {!canSend ? (
            <p className="text-center text-xs text-muted-foreground">
              Mova o card para &quot;Em atendimento&quot; para assumir o diálogo e enviar mensagens.
            </p>
          ) : null}
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={canSend ? "Digite sua mensagem…" : "…"}
              disabled={!canSend}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={!canSend || !inputText.trim() || sending}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {sending ? "…" : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
