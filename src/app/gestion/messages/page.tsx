import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Conversation } from "@/lib/types";
import { PageHeader } from "@/components/admin/Shell";
import { CONVERSATION_FIELDS } from "@/lib/constants";
import { Inbox } from "./Inbox";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const [user, sp] = await Promise.all([requireRole(["manager", "admin"], "/gestion/messages"), searchParams]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select(CONVERSATION_FIELDS)
    .order("last_message_at", { ascending: false })
    .limit(100)
    .returns<Conversation[]>();

  return (
    <>
      <PageHeader title="Messages" description="Discussions avec les clients depuis le site, en direct." />
      <Inbox initial={data ?? []} staffId={user.id} initialSelected={sp.c ?? null} />
    </>
  );
}
