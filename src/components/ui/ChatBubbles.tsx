"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, ChatSender } from "@/lib/types";
import { cn } from "@/lib/cn";

const time = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "Africa/Tunis" });
const day = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Africa/Tunis" });

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
        const newDay = !prev || day.format(new Date(prev.created_at)) !== day.format(new Date(m.created_at));
        return (
          <div key={m.id} className="flex flex-col">
            {newDay && (
              <p className="my-2 self-center rounded-full bg-tile px-3 py-0.5 text-xs font-semibold text-muted">
                {day.format(new Date(m.created_at))}
              </p>
            )}
            <div className={cn("flex max-w-[85%] flex-col", isMine ? "self-end items-end" : "self-start items-start")}>
              {!isMine && prev?.sender !== m.sender && (
                <span className="mb-0.5 px-1 text-xs font-semibold text-muted">{theirLabel}</span>
              )}
              <p
                className={cn(
                  "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-snug",
                  isMine ? "rounded-br-md bg-ink text-white" : "rounded-bl-md border border-line bg-white text-ink",
                )}
              >
                {m.body}
              </p>
              <span className="mt-0.5 px-1 text-[11px] text-muted">{time.format(new Date(m.created_at))}</span>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
