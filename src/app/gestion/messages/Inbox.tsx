"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCheck, LoaderCircle, MessagesSquare, Phone, RotateCcw, Send, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, Conversation } from "@/lib/types";
import { telHref } from "@/lib/format";
import { CONVERSATION_FIELDS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { ChatBubbles } from "@/components/ui/ChatBubbles";

const listTime = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "Africa/Tunis" });
const listDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Africa/Tunis" });

function shortDate(iso: string) {
  const d = new Date(iso);
  return Date.now() - d.getTime() < 20 * 3600 * 1000 ? listTime.format(d) : listDate.format(d);
}

type Row = ChatMessage & { conversation_id: string };

export function Inbox({
  initial,
  staffId,
  initialSelected,
}: {
  initial: Conversation[];
  staffId: string;
  initialSelected: string | null;
}) {
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const [conversations, setConversations] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const visible = useMemo(
    () => conversations.filter((c) => filter === "all" || !c.is_closed || c.id === selectedId),
    [conversations, filter, selectedId],
  );

  const refreshList = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select(CONVERSATION_FIELDS)
      .order("last_message_at", { ascending: false })
      .limit(100)
      .returns<Conversation[]>();
    if (data) setConversations(data);
  }, [supabase]);

  const markRead = useCallback(
    async (id: string) => {
      setConversations((list) => list.map((c) => (c.id === id ? { ...c, staff_unread: 0 } : c)));
      await supabase.from("conversations").update({ staff_unread: 0 }).eq("id", id).gt("staff_unread", 0);
      router.refresh(); // nav badge
    },
    [supabase, router],
  );

  // Load the selected thread
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    supabase
      .from("messages")
      .select("id, sender, body, created_at")
      .eq("conversation_id", selectedId)
      .order("id")
      .limit(500)
      .returns<ChatMessage[]>()
      .then(({ data }) => {
        if (cancelled) return;
        setMessages(data ?? []);
        setLoading(false);
      });
    markRead(selectedId);
    const url = new URL(window.location.href);
    url.searchParams.set("c", selectedId);
    window.history.replaceState(null, "", url);
    return () => {
      cancelled = true;
    };
  }, [selectedId, supabase, markRead]);

  // Live: new messages and conversation changes
  useEffect(() => {
    const channel = supabase
      .channel("backoffice-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Row;
        if (m.conversation_id === selectedRef.current) {
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
          if (m.sender === "customer" && document.visibilityState === "visible") markRead(m.conversation_id);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => refreshList())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refreshList, markRead]);

  async function send() {
    const body = draft.trim();
    if (!body || !selectedId || sending) return;
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: selectedId, sender: "staff", staff_id: staffId, body })
      .select("id, sender, body, created_at")
      .single<ChatMessage>();
    setSending(false);
    if (error) {
      toast.error("Message non envoyé", { description: error.message });
      return;
    }
    setDraft("");
    setMessages((prev) => (prev.some((p) => p.id === data.id) ? prev : [...prev, data]));
  }

  async function toggleClosed() {
    if (!selected) return;
    const is_closed = !selected.is_closed;
    const { error } = await supabase.from("conversations").update({ is_closed }).eq("id", selected.id);
    if (error) toast.error(error.message);
    else {
      setConversations((list) => list.map((c) => (c.id === selected.id ? { ...c, is_closed } : c)));
      toast.success(is_closed ? "Discussion archivée" : "Discussion rouverte");
    }
  }

  return (
    <div className="card grid h-[calc(100dvh-13rem)] min-h-[480px] overflow-hidden lg:grid-cols-[340px_1fr]">
      {/* Conversation list */}
      <aside className={cn("flex min-h-0 flex-col border-line lg:border-r", selectedId && "hidden lg:flex")}>
        <div className="flex gap-1 border-b border-line p-2">
          {(["open", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold",
                filter === f ? "bg-ink text-white" : "text-muted hover:bg-ground",
              )}
            >
              {f === "open" ? "En cours" : "Toutes"}
            </button>
          ))}
        </div>
        {visible.length === 0 ? (
          <p className="m-auto p-6 text-center text-muted">Aucune discussion pour le moment.</p>
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {visible.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  aria-current={c.id === selectedId ? "true" : undefined}
                  className={cn(
                    "flex w-full cursor-pointer gap-3 border-b border-line px-4 py-3 text-left transition",
                    c.id === selectedId ? "bg-accent/25" : "hover:bg-ground",
                    c.is_closed && "opacity-60",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tile font-bold uppercase">
                    {c.customer_name.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn("truncate", c.staff_unread > 0 ? "font-bold" : "font-semibold")}>{c.customer_name}</span>
                      <span className="shrink-0 text-xs text-muted">{shortDate(c.last_message_at)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-sm", c.staff_unread > 0 ? "font-semibold text-ink" : "text-muted")}>
                        {c.last_message ?? "…"}
                      </span>
                      {c.staff_unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold">
                          {c.staff_unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Thread */}
      <section className={cn("flex min-h-0 flex-col bg-ground", !selectedId && "hidden lg:flex")}>
        {!selected ? (
          <div className="m-auto flex flex-col items-center gap-2 p-6 text-center text-muted">
            <MessagesSquare className="size-10" aria-hidden="true" />
            <p>Choisissez une discussion pour répondre.</p>
          </div>
        ) : (
          <>
            <header className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-3">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Retour à la liste"
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg hover:bg-ground lg:hidden"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-bold">
                  {selected.customer_name}
                  {selected.user_id && (
                    <span className="badge bg-sky-100 text-sky-900 ring-sky-300">
                      <UserRound className="mr-1 size-3" aria-hidden="true" />
                      Client inscrit
                    </span>
                  )}
                </p>
                {selected.phone ? (
                  <a href={telHref(selected.phone)} className="inline-flex items-center gap-1 text-sm text-muted hover:underline">
                    <Phone className="size-3.5" aria-hidden="true" />
                    {selected.phone}
                  </a>
                ) : (
                  <p className="text-sm text-muted">Pas de téléphone indiqué</p>
                )}
              </div>
              <button type="button" onClick={toggleClosed} className="btn-outline h-10 px-3 text-sm">
                {selected.is_closed ? (
                  <>
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Rouvrir
                  </>
                ) : (
                  <>
                    <CheckCheck className="size-4" aria-hidden="true" />
                    Archiver
                  </>
                )}
              </button>
            </header>

            {loading ? (
              <div className="m-auto">
                <LoaderCircle className="size-6 animate-spin text-muted" aria-label="Chargement" />
              </div>
            ) : (
              <ChatBubbles messages={messages} mine="staff" theirLabel={selected.customer_name} className="flex-1" />
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-end gap-2 border-t border-line bg-white p-3"
            >
              <textarea
                className="textarea max-h-40 min-h-11 flex-1 resize-none py-2.5"
                rows={2}
                placeholder="Votre réponse… (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)"
                aria-label="Votre réponse"
                maxLength={2000}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button type="submit" disabled={sending || !draft.trim()} className="btn-accent h-11">
                {sending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                Envoyer
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
