-- =============================================================================
-- Vivre: Initial Schema Migration
-- =============================================================================
-- Tables: profiles, attributes, tasks, task_completions, shop_items, inventory
-- Includes: RLS policies, indexes, triggers, narrowly scoped functions
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto" with schema "extensions";

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique,
  level           integer     not null default 1,
  current_xp      integer     not null default 0,
  soft_currency   integer     not null default 0,
  rare_currency   integer     not null default 0,
  current_streak  integer     not null default 0,
  longest_streak  integer     not null default 0,
  streak_shield_available  boolean   not null default true,
  streak_shield_refill_at  timestamptz,
  last_completion_at       timestamptz,
  timezone                 text      not null default 'Asia/Kolkata',
  theme_preference         text      not null default 'system',
  sound_enabled            boolean   not null default true,
  calm_mode                boolean   not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.profiles is 'Player profile, 1:1 with auth.users';

-- ---------------------------------------------------------------------------
-- 2. attributes
-- ---------------------------------------------------------------------------
create table public.attributes (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references public.profiles(id) on delete cascade,
  name     text not null,
  value    integer not null default 0,
  unique(user_id, name)
);

comment on table public.attributes is 'Per-user attribute scores (Body, Mind, Discipline, Craft, Spirit)';

-- ---------------------------------------------------------------------------
-- 3. tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  title        text        not null,
  category     text        not null,
  is_recurring boolean     not null default false,
  archived_at  timestamptz,
  created_at   timestamptz not null default now()
);

comment on table public.tasks is 'User-created tasks / habits';

-- ---------------------------------------------------------------------------
-- 4. task_completions  (immutable ledger)
-- ---------------------------------------------------------------------------
create table public.task_completions (
  id               uuid primary key default gen_random_uuid(),
  task_id          uuid        not null references public.tasks(id),
  user_id          uuid        not null references public.profiles(id),
  completed_at     timestamptz not null default now(),
  xp_awarded       integer     not null default 0,
  bonus_roll       text        not null,
  category         text        not null,
  idempotency_key  uuid        not null,
  unique(user_id, idempotency_key)
);

comment on table public.task_completions is 'Immutable append-only ledger of task completions';

-- ---------------------------------------------------------------------------
-- 5. shop_items
-- ---------------------------------------------------------------------------
create table public.shop_items (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  description   text,
  cost          integer,
  currency_type text,
  category      text,
  active        boolean not null default true
);

comment on table public.shop_items is 'Catalog of purchasable items';

-- ---------------------------------------------------------------------------
-- 6. inventory
-- ---------------------------------------------------------------------------
create table public.inventory (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id),
  item_id     uuid        not null references public.shop_items(id),
  equipped    boolean     not null default false,
  acquired_at timestamptz not null default now(),
  unique(user_id, item_id)
);

comment on table public.inventory is 'Items owned by a player';

-- ===========================================================================
-- INDEXES
-- ===========================================================================
create index idx_tasks_user_archived    on public.tasks(user_id, archived_at);
create index idx_tasks_user_created     on public.tasks(user_id, created_at);
create index idx_completions_user_date  on public.task_completions(user_id, completed_at);
create index idx_completions_user_cat   on public.task_completions(user_id, category, completed_at);
create index idx_inventory_user         on public.inventory(user_id);

-- ===========================================================================
-- TRIGGERS: updated_at
-- ===========================================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- ===========================================================================
-- TRIGGER: seed default attributes on profile creation
-- ===========================================================================
create or replace function public.handle_new_profile_attributes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.attributes (user_id, name, value) values
    (new.id, 'Body',       0),
    (new.id, 'Mind',       0),
    (new.id, 'Discipline', 0),
    (new.id, 'Craft',      0),
    (new.id, 'Spirit',     0);
  return new;
end;
$$;

create trigger on_profile_created_seed_attributes
  after insert on public.profiles
  for each row
  execute function public.handle_new_profile_attributes();

-- ===========================================================================
-- TRIGGER: create profile on auth.users insert
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ===========================================================================
-- TRIGGERS: task_completions immutability
-- ===========================================================================
create or replace function public.prevent_completion_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'task_completions is an immutable ledger: UPDATE is forbidden';
end;
$$;

create or replace function public.prevent_completion_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'task_completions is an immutable ledger: DELETE is forbidden';
end;
$$;

create trigger prevent_completion_update
  before update on public.task_completions
  for each row
  execute function public.prevent_completion_update();

create trigger prevent_completion_delete
  before delete on public.task_completions
  for each row
  execute function public.prevent_completion_delete();

-- ===========================================================================
-- ROW LEVEL SECURITY
-- ===========================================================================

-- ---- profiles ----
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- attributes ----
alter table public.attributes enable row level security;

create policy "Users can view own attributes"
  on public.attributes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own attributes"
  on public.attributes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- tasks ----
alter table public.tasks enable row level security;

create policy "Users can view own tasks"
  on public.tasks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create own tasks"
  on public.tasks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No DELETE policy: tasks should be archived, not deleted

-- ---- task_completions ----
alter table public.task_completions enable row level security;

create policy "Users can view own completions"
  on public.task_completions for select
  to authenticated
  using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for authenticated role.
-- Completions are created exclusively through server-side functions
-- using the service-role (admin) client which bypasses RLS.

-- ---- shop_items ----
alter table public.shop_items enable row level security;

create policy "Authenticated users can view active shop items"
  on public.shop_items for select
  to authenticated
  using (active = true);

-- No INSERT/UPDATE/DELETE for authenticated role.
-- Shop catalog is managed by administrators via service-role.

-- ---- inventory ----
alter table public.inventory enable row level security;

create policy "Users can view own inventory"
  on public.inventory for select
  to authenticated
  using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE for authenticated role.
-- Inventory changes go through purchase_item() via service-role.

-- ===========================================================================
-- NARROWLY SCOPED DATABASE FUNCTIONS (service-role only)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- complete_task: Server-authoritative task completion
-- ---------------------------------------------------------------------------
create or replace function public.complete_task(
  p_task_id         uuid,
  p_user_id         uuid,
  p_idempotency_key uuid,
  p_xp_awarded      integer,
  p_bonus_roll      text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_category    text;
  v_completion_id uuid;
begin
  -- Verify the task belongs to the user
  select category into v_category
    from public.tasks
    where id = p_task_id and user_id = p_user_id;

  if v_category is null then
    raise exception 'Task not found or does not belong to user';
  end if;

  -- Insert the completion record
  insert into public.task_completions (
    task_id, user_id, idempotency_key, xp_awarded, bonus_roll, category
  ) values (
    p_task_id, p_user_id, p_idempotency_key, p_xp_awarded, p_bonus_roll, v_category
  )
  on conflict (user_id, idempotency_key) do nothing
  returning id into v_completion_id;

  -- If the insert was a no-op (idempotent duplicate), return null
  if v_completion_id is null then
    return null;
  end if;

  -- Award XP to the profile
  update public.profiles
    set current_xp = current_xp + p_xp_awarded,
        last_completion_at = now()
    where id = p_user_id;

  return v_completion_id;
end;
$$;

comment on function public.complete_task is 'Server-authoritative task completion. Must be called via service-role client only.';

-- Revoke execute from public/authenticated roles — only service_role can call
revoke execute on function public.complete_task(uuid, uuid, uuid, integer, text) from public;
revoke execute on function public.complete_task(uuid, uuid, uuid, integer, text) from authenticated;

-- ---------------------------------------------------------------------------
-- purchase_item: Server-authoritative shop purchase
-- ---------------------------------------------------------------------------
create or replace function public.purchase_item(
  p_item_id uuid,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cost          integer;
  v_currency_type text;
  v_balance       integer;
  v_inventory_id  uuid;
begin
  -- Look up the item
  select cost, currency_type into v_cost, v_currency_type
    from public.shop_items
    where id = p_item_id and active = true;

  if v_cost is null then
    raise exception 'Item not found or not available';
  end if;

  -- Check user balance for the relevant currency
  if v_currency_type = 'rare' then
    select rare_currency into v_balance from public.profiles where id = p_user_id;
  else
    select soft_currency into v_balance from public.profiles where id = p_user_id;
  end if;

  if v_balance is null then
    raise exception 'User profile not found';
  end if;

  if v_balance < v_cost then
    raise exception 'Insufficient currency';
  end if;

  -- Deduct cost
  if v_currency_type = 'rare' then
    update public.profiles set rare_currency = rare_currency - v_cost where id = p_user_id;
  else
    update public.profiles set soft_currency = soft_currency - v_cost where id = p_user_id;
  end if;

  -- Add to inventory (idempotent: unique constraint on user_id, item_id)
  insert into public.inventory (user_id, item_id)
  values (p_user_id, p_item_id)
  on conflict (user_id, item_id) do nothing
  returning id into v_inventory_id;

  if v_inventory_id is null then
    raise exception 'Item already owned';
  end if;

  return v_inventory_id;
end;
$$;

comment on function public.purchase_item is 'Server-authoritative item purchase. Must be called via service-role client only.';

-- Revoke execute from public/authenticated roles
revoke execute on function public.purchase_item(uuid, uuid) from public;
revoke execute on function public.purchase_item(uuid, uuid) from authenticated;
