"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, ChatSender } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDateL, formatTimeL } from "@/i18n/config";

/** Scrollable message list; `mine` is the side drawn on the right. Sticks to the bottom on new messages. */
export function ChatBubbles({
  messages,
  mine,
  theirLabel,
  className,
  empty,
}: {
  messages: ChatMessage[];
  mine: ChatSender;
  theirLabel: string;
  className?: string;
  empty?: React.ReactNode;
}) {
  const { locale } = useI18n();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className={cn("flex flex-col gap-2 overflow-y-auto p-4", className)} aria-live="polite">
      {messages.length === 0 && empty}
      {messages.map((m, i) => {
        const isMine = m.sender === mine;
        const prev = messages[i - 1];
        const newDay = !prev || formatDateL(prev.created_at, locale) !== formatDateL(m.created_at, locale);
        return (
          <div key={m.id} className="flex flex-col">
            {newDay && (
              <p className="my-2 self-center rounded-full bg-tile px-3 py-0.5 text-xs font-semibold text-muted">
                {formatDateL(m.created_at, locale)}
              </p>
            )}
            <div className={cn("flex max-w-[85%] flex-col", isMine ? "self-end items-end" : "self-start items-start")}>
              {!isMine && prev?.sender !== m.sender && (
                <span className="mb-0.5 px-1 text-xs font-semibold text-muted">{theirLabel}</span>
              )}
              {m.image_url && (
                <a href={m.image_url} target="_blank" rel="noopener noreferrer" className="mb-1 block">
                  {/* Plain img: chat photos have any size and are shown as they are */}
                  <img
                    src={m.image_url}
                    alt=""
                    loading="lazy"
                    className={cn(
                      "max-h-72 max-w-full rounded-2xl border border-line bg-white object-contain",
                      isMine ? "rounded-ee-md" : "rounded-es-md",
                    )}
                  />
                </a>
              )}
              {m.body.trim() && (
                <p
                  className={cn(
                    "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-snug",
                    isMine ? "rounded-ee-md bg-ink text-white" : "rounded-es-md border border-line bg-white text-ink",
                  )}
                >
                  {m.body}
                </p>
              )}
              <span className="mt-0.5 px-1 text-[11px] text-muted">{formatTimeL(m.created_at, locale)}</span>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
