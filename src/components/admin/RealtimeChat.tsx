"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/** Live alert + unread badge refresh whenever a customer writes in the chat. */
export function RealtimeChat() {
  const router = useRouter();
  const pathname = usePathname();
  const onInbox = pathname.startsWith("/gestion/messages");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("backoffice-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: "sender=eq.customer" },
        (payload) => {
          const m = payload.new as { conversation_id: string; body: string };
          if (!onInbox) {
            toast.info("Nouveau message client", {
              description: m.body.length > 90 ? `${m.body.slice(0, 90)}…` : m.body,
              duration: 10000,
              action: { label: "Répondre", onClick: () => router.push(`/gestion/messages?c=${m.conversation_id}`) },
            });
          }
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, onInbox]);

  return null;
}
