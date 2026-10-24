-- =====================================================================
--  Quincaillerie en ligne — photos in the customer service chat
--  Run this file AFTER 03_chat.sql (Supabase → SQL Editor → Run).
--  Staff can attach a photo to a reply; customers see it in the chat.
-- =====================================================================

alter table public.messages add column if not exists image_url text;

-- A message is either text, a photo, or both
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check check (
  char_length(body) <= 2000
  and (char_length(btrim(body)) > 0 or image_url is not null)
);

-- Conversation preview shows "📷 Photo" for a photo without text
create or replace function public.on_message_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
     set last_message    = case when btrim(new.body) = '' then '📷 Photo' else left(new.body, 200) end,
         last_message_at = new.created_at,
         is_closed       = false,
         staff_unread    = case when new.sender = 'customer' then staff_unread + 1 else 0 end,
         customer_unread = case when new.sender = 'staff' then customer_unread + 1 else customer_unread end
   where id = new.conversation_id;
  return new;
end $$;

-- The customer's message list now includes the photo
drop function if exists public.chat_messages(uuid, bigint);
create function public.chat_messages(p_token uuid, p_after bigint default 0)
returns table (id bigint, sender public.chat_sender, body text, image_url text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  v_id := public.chat_conversation_id(p_token);
  if v_id is null then
    raise exception 'Conversation introuvable';
  end if;

  update public.conversations c set customer_unread = 0
   where c.id = v_id and c.customer_unread > 0;

  return query
    select m.id, m.sender, m.body, m.image_url, m.created_at
      from public.messages m
     where m.conversation_id = v_id and m.id > coalesce(p_after, 0)
     order by m.id
     limit 200;
end $$;

revoke all on function public.chat_messages(uuid, bigint) from public;
grant execute on function public.chat_messages(uuid, bigint) to anon, authenticated;

-- Staff replies may only point at photos from the chat bucket
drop policy if exists "messages: staff reply" on public.messages;
create policy "messages: staff reply" on public.messages
  for insert to authenticated
  with check (
    public.is_staff() and sender = 'staff' and staff_id = auth.uid()
    and (image_url is null or image_url like '%/storage/v1/object/public/chat-images/%')
  );

-- ---------------------------------------------------------------------
-- Storage: public bucket for chat photos, staff uploads.
-- Photos are opened through their (random) public URL only: there is no
-- read policy, so nobody can list the bucket.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-images', 'chat-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

drop policy if exists "chat images: staff insert" on storage.objects;
create policy "chat images: staff insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-images' and public.is_staff());

drop policy if exists "chat images: staff delete" on storage.objects;
create policy "chat images: staff delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'chat-images' and public.is_staff());
