-- =====================================================================
--  Quincaillerie en ligne — customer service chat
--  Run this file AFTER 01_schema.sql (Supabase → SQL Editor → Run).
--
--  Customers (guests or signed in) never touch the tables directly: they
--  hold a secret conversation token and go through the chat_* functions.
--  Staff read and answer through the tables (RLS: is_staff()).
-- =====================================================================

do $$ begin
  create type public.chat_sender as enum ('customer', 'staff');
exception when duplicate_object then null; end $$;

create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  token           uuid not null unique default gen_random_uuid(),   -- secret held by the customer's browser
  user_id         uuid references auth.users (id) on delete set null,
  customer_name   text not null,
  phone           text,
  is_closed       boolean not null default false,
  staff_unread    int not null default 0,
  customer_unread int not null default 0,
  last_message    text,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists conversations_user_idx on public.conversations (user_id);
create index if not exists conversations_last_idx on public.conversations (last_message_at desc);

create table if not exists public.messages (
  id              bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender          public.chat_sender not null,
  staff_id        uuid references auth.users (id) on delete set null,
  body            text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, id);

-- Keep the conversation summary (preview, unread counters) in sync
create or replace function public.on_message_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
     set last_message    = left(new.body, 200),
         last_message_at = new.created_at,
         is_closed       = false,
         staff_unread    = case when new.sender = 'customer' then staff_unread + 1 else 0 end,
         customer_unread = case when new.sender = 'staff' then customer_unread + 1 else customer_unread end
   where id = new.conversation_id;
  return new;
end $$;

drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.on_message_insert();

-- ---------------------------------------------------------------------
-- Customer RPCs
-- ---------------------------------------------------------------------

-- Token → conversation id. A conversation that belongs to an account is only
-- reachable while signed in to that account (shared computers).
create or replace function public.chat_conversation_id(p_token uuid)
returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.conversations
   where token = p_token and (user_id is null or user_id = auth.uid())
$$;

revoke all on function public.chat_conversation_id(uuid) from public;

-- Find the caller's conversation (by token, or by account when signed in).
-- Returns null when there is none yet.
create or replace function public.chat_find(p_token uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_conv public.conversations%rowtype;
begin
  if p_token is not null then
    select * into v_conv from public.conversations where id = public.chat_conversation_id(p_token);
  end if;
  if v_conv.id is null and auth.uid() is not null then
    select * into v_conv from public.conversations
     where user_id = auth.uid()
     order by last_message_at desc limit 1;
  end if;
  if v_conv.id is null then
    return null;
  end if;
  -- A guest conversation is attached to the account once the customer signs in
  if v_conv.user_id is null and auth.uid() is not null then
    update public.conversations set user_id = auth.uid() where id = v_conv.id;
  end if;
  return jsonb_build_object('token', v_conv.token, 'customer_name', v_conv.customer_name,
                            'unread', v_conv.customer_unread);
end $$;

-- Start a conversation with a first message
create or replace function public.chat_start(p_name text, p_phone text, p_body text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id    uuid;
  v_token uuid;
begin
  if char_length(btrim(coalesce(p_name, ''))) < 2 then
    raise exception 'Indiquez votre nom';
  end if;
  if char_length(btrim(coalesce(p_body, ''))) = 0 then
    raise exception 'Le message est vide';
  end if;

  insert into public.conversations (user_id, customer_name, phone)
  values (auth.uid(), left(btrim(p_name), 120), nullif(left(btrim(coalesce(p_phone, '')), 25), ''))
  returning id, token into v_id, v_token;

  insert into public.messages (conversation_id, sender, body)
  values (v_id, 'customer', left(btrim(p_body), 2000));

  return v_token;
end $$;

-- Send a message in an existing conversation
create or replace function public.chat_send(p_token uuid, p_body text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  v_id := public.chat_conversation_id(p_token);
  if v_id is null then
    raise exception 'Conversation introuvable';
  end if;
  if char_length(btrim(coalesce(p_body, ''))) = 0 then
    raise exception 'Le message est vide';
  end if;
  if (select count(*) from public.messages
       where conversation_id = v_id and sender = 'customer'
         and created_at > now() - interval '1 minute') >= 15 then
    raise exception 'Trop de messages, patientez un instant';
  end if;

  insert into public.messages (conversation_id, sender, body)
  values (v_id, 'customer', left(btrim(p_body), 2000));
end $$;

-- Messages newer than p_after (0 = all). Marks staff replies as read.
create or replace function public.chat_messages(p_token uuid, p_after bigint default 0)
returns table (id bigint, sender public.chat_sender, body text, created_at timestamptz)
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
    select m.id, m.sender, m.body, m.created_at
      from public.messages m
     where m.conversation_id = v_id and m.id > coalesce(p_after, 0)
     order by m.id
     limit 200;
end $$;

revoke all on function public.chat_find(uuid)                    from public;
revoke all on function public.chat_start(text, text, text)       from public;
revoke all on function public.chat_send(uuid, text)              from public;
revoke all on function public.chat_messages(uuid, bigint)        from public;
grant execute on function public.chat_find(uuid)                 to anon, authenticated;
grant execute on function public.chat_start(text, text, text)    to anon, authenticated;
grant execute on function public.chat_send(uuid, text)           to anon, authenticated;
grant execute on function public.chat_messages(uuid, bigint)     to anon, authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security: staff only (customers use the functions above)
-- ---------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

drop policy if exists "conversations: staff read" on public.conversations;
create policy "conversations: staff read" on public.conversations
  for select to authenticated using (public.is_staff());

drop policy if exists "conversations: staff update" on public.conversations;
create policy "conversations: staff update" on public.conversations
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "conversations: admin delete" on public.conversations;
create policy "conversations: admin delete" on public.conversations
  for delete to authenticated using (public.is_admin());

revoke update on public.conversations from authenticated, anon;
grant update (is_closed, staff_unread) on public.conversations to authenticated;

drop policy if exists "messages: staff read" on public.messages;
create policy "messages: staff read" on public.messages
  for select to authenticated using (public.is_staff());

drop policy if exists "messages: staff reply" on public.messages;
create policy "messages: staff reply" on public.messages
  for insert to authenticated
  with check (public.is_staff() and sender = 'staff' and staff_id = auth.uid());

-- ---------------------------------------------------------------------
-- Realtime: live inbox in the back office
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
