"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, LoaderCircle, MessageCircle, MessageSquareText, Send, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/cn";
import { ChatBubbles } from "@/components/ui/ChatBubbles";
import { useI18n } from "@/i18n/I18nProvider";
import { translateDbError } from "@/i18n/config";

const TOKEN_KEY = "chat-token";
const OPEN_POLL_MS = 4000;
const CLOSED_POLL_MS = 30000;

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode: the conversation still works for this visit */
  }
}

/** Bottom-right stack: scroll-to-top button and the customer service chat. */
export function FloatingActions({
  shopName,
  whatsappUrl,
  userId,
  defaultName,
  defaultPhone,
}: {
  shopName: string;
  whatsappUrl: string;
  userId?: string | null;
  defaultName?: string | null;
  defaultPhone?: string | null;
}) {
  const { t } = useI18n();
  const [showTop, setShowTop] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed end-4 bottom-24 z-40 flex flex-col items-end gap-3 md:end-6 md:bottom-6">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0 })}
        aria-label={t.scrollTop}
        tabIndex={showTop ? 0 : -1}
        className={cn(
          "flex size-12 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-white text-ink shadow-lg transition hover:bg-ground",
          showTop ? "pointer-events-auto opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        <ArrowUp className="size-5" aria-hidden="true" />
      </button>

      <ChatWidget
        open={open}
        onOpenChange={setOpen}
        shopName={shopName}
        whatsappUrl={whatsappUrl}
        userId={userId ?? null}
        defaultName={defaultName ?? ""}
        defaultPhone={defaultPhone ?? ""}
      />
    </div>
  );
}

function ChatWidget({
  open,
  onOpenChange,
  shopName,
  whatsappUrl,
  userId,
  defaultName,
  defaultPhone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopName: string;
  whatsappUrl: string;
  userId: string | null;
  defaultName: string;
  defaultPhone: string;
}) {
  const { t, locale } = useI18n();
  const c = t.chat;
  const supabase = useRef(createClient()).current;
  const [token, setToken] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastId = useRef(0);

  // Find an existing conversation (this browser's token, or the signed-in account)
  const find = useCallback(async () => {
    const { data } = await supabase.rpc("chat_find", { p_token: readToken() });
    const found = data as { token: string; customer_name: string; unread: number } | null;
    setToken((current) => {
      const next = found?.token ?? null;
      if (next !== current) {
        // Signed in/out on this browser: start from the right thread
        lastId.current = 0;
        setMessages([]);
      }
      return next;
    });
    if (found) {
      saveToken(found.token);
      setUnread(found.unread);
    } else {
      setUnread(0);
    }
  }, [supabase]);

  const loadMessages = useCallback(
    async (t: string) => {
      const { data, error } = await supabase.rpc("chat_messages", { p_token: t, p_after: lastId.current });
      if (error) return;
      const fresh = (data ?? []) as ChatMessage[];
      if (fresh.length) {
        lastId.current = fresh[fresh.length - 1].id;
        setMessages((prev) => [...prev, ...fresh.filter((m) => !prev.some((p) => p.id === m.id))]);
      }
      setUnread(0);
    },
    [supabase],
  );

  // Again after signing in or out
  useEffect(() => {
    find();
  }, [find, userId]);

  // Closed: check now and then for replies so the badge shows up
  useEffect(() => {
    if (open || !token) return;
    const id = setInterval(find, CLOSED_POLL_MS);
    return () => clearInterval(id);
  }, [open, token, find]);

  // Open: poll the thread
  useEffect(() => {
    if (!open || !token) return;
    loadMessages(token);
    const id = setInterval(() => loadMessages(token), OPEN_POLL_MS);
    return () => clearInterval(id);
  }, [open, token, loadMessages]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setError(null);

    if (!token && name.trim().length < 2) {
      setError(c.nameFirst);
      return;
    }

    setSending(true);
    if (token) {
      const { error } = await supabase.rpc("chat_send", { p_token: token, p_body: body });
      if (error) setError(translateDbError(error.message, locale));
      else {
        setDraft("");
        await loadMessages(token);
      }
    } else {
      const { data, error } = await supabase.rpc("chat_start", { p_name: name, p_phone: phone, p_body: body });
      if (error) setError(translateDbError(error.message, locale));
      else {
        const t = data as string;
        saveToken(t);
        setToken(t);
        setDraft("");
      }
    }
    setSending(false);
  }

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-label={c.dialogLabel}
          className="animate-pop pointer-events-auto flex h-[min(560px,calc(100dvh-9rem))] w-[min(380px,calc(100vw-2rem))] origin-bottom-right rtl:origin-bottom-left flex-col overflow-hidden rounded-2xl border border-line bg-ground shadow-2xl"
        >
          <header className="flex items-center gap-3 bg-ink px-4 py-3 text-white">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent text-ink">
              <MessageSquareText className="size-5" aria-hidden="true" />
            </span>
            <div className="flex-1 leading-tight">
              <p className="font-bold">{c.title(shopName)}</p>
              <p className="text-sm text-zinc-300">{c.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={c.closeLabel}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg hover:bg-white/10"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>

          <ChatBubbles
            messages={messages}
            mine="customer"
            theirLabel={shopName}
            className="flex-1"
            empty={
              <div className="m-auto max-w-[280px] text-center text-sm text-muted">
                <p className="font-semibold text-ink">{c.emptyTitle}</p>
                <p className="mt-1">{c.emptyText}</p>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-whatsapp underline">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {c.orWhatsapp}
                </a>
              </div>
            }
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex flex-col gap-2 border-t border-line bg-white p-3"
          >
            {!token && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input h-10 text-sm"
                  placeholder={c.namePlaceholder}
                  aria-label={c.nameLabel}
                  autoComplete="name"
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  className="input h-10 text-sm"
                  placeholder={c.phonePlaceholder}
                  aria-label={c.phoneLabel}
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  maxLength={25}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            )}
            {error && <p className="text-sm font-semibold text-danger" role="alert">{error}</p>}
            <div className="flex items-end gap-2">
              <textarea
                className="textarea max-h-32 min-h-11 flex-1 resize-none py-2.5 text-[15px]"
                rows={1}
                placeholder={c.messagePlaceholder}
                aria-label={c.messageLabel}
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
              <button type="submit" disabled={sending || !draft.trim()} aria-label={c.send} className="btn-accent size-11 shrink-0 px-0">
                {sending ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-5 rtl:-scale-x-100" aria-hidden="true" />}
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-label={open ? c.closeLabel : c.open}
        className="pointer-events-auto relative flex h-14 cursor-pointer items-center gap-2 rounded-full bg-accent px-5 font-bold text-ink shadow-lg transition hover:bg-accent-strong active:scale-[0.98]"
      >
        {open ? <X className="size-6" aria-hidden="true" /> : <MessageSquareText className="size-6" aria-hidden="true" />}
        <span className="hidden sm:inline">{open ? c.close : c.open}</span>
        {!open && unread > 0 && (
          <span className="absolute -end-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-danger px-1.5 text-xs text-white">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
