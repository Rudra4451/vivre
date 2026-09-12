-- =============================================================================
-- Vivre: Transactional Email Notifications Schema Migration
-- =============================================================================
-- 1. Extend profiles with notification preferences and email
-- 2. Update auth.users trigger to sync email
-- 3. Create notification_deliveries table with unique constraint for idempotency
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Extend public.profiles
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists email text,
  add column if not exists notification_email_comeback boolean not null default true,
  add column if not exists notification_email_weekly_recap boolean not null default true;

comment on column public.profiles.notification_email_comeback is 'User preference for streak/comeback reminder emails';
comment on column public.profiles.notification_email_weekly_recap is 'User preference for weekly progress recap emails';

-- Backfill profile emails from auth.users if available
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    update public.profiles p
    set email = u.email
    from auth.users u
    where p.id = u.id and p.email is null;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Update Auth Triggers to Sync Email
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.email
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = new.email,
        updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    create trigger on_auth_user_email_updated
      after update of email on auth.users
      for each row
      execute function public.handle_user_email_updated();
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 3. notification_deliveries Table
-- -----------------------------------------------------------------------------
create table if not exists public.notification_deliveries (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  notification_type  text not null check (notification_type in ('comeback', 'weekly_recap')),
  sent_at            timestamptz not null default now(),
  local_date         date not null,
  metadata           jsonb default '{}'::jsonb,
  constraint uq_notification_deliveries unique(user_id, notification_type, local_date)
);

comment on table public.notification_deliveries is 'Immutable ledger of sent transactional notifications to enforce cooldowns and deduplicate cron runs';

create index if not exists idx_notification_deliveries_user_type
  on public.notification_deliveries(user_id, notification_type);

create index if not exists idx_notification_deliveries_local_date
  on public.notification_deliveries(local_date);

create index if not exists idx_notification_deliveries_sent_at
  on public.notification_deliveries(sent_at);

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.notification_deliveries enable row level security;

create policy "Users can view own notification deliveries"
  on public.notification_deliveries for select
  using (auth.uid() = user_id);

create policy "Service role has full access to notification deliveries"
  on public.notification_deliveries for all
  using (true)
  with check (true);
