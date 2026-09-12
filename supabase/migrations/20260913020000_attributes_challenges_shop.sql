-- =============================================================================
-- Vivre: Attributes Radar, Weekly Challenges & Atomic Cosmetic Shop Economy
-- Migration: 20260913020000_attributes_challenges_shop.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Currency & Value Non-Negative Database Constraints
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_profiles_soft_currency_non_negative'
  ) then
    alter table public.profiles
      add constraint chk_profiles_soft_currency_non_negative check (soft_currency >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_profiles_rare_currency_non_negative'
  ) then
    alter table public.profiles
      add constraint chk_profiles_rare_currency_non_negative check (rare_currency >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_attributes_value_non_negative'
  ) then
    alter table public.attributes
      add constraint chk_attributes_value_non_negative check (value >= 0);
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Shop Purchases Ledger (Idempotency Tracking)
-- -----------------------------------------------------------------------------
create table if not exists public.shop_purchases (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  item_id         uuid        not null references public.shop_items(id) on delete restrict,
  cost            integer     not null check (cost >= 0),
  currency_type   text        not null check (currency_type in ('soft', 'rare')),
  idempotency_key uuid        not null,
  created_at      timestamptz not null default now(),
  unique(user_id, idempotency_key)
);

create index if not exists idx_shop_purchases_user on public.shop_purchases(user_id, created_at);

alter table public.shop_purchases enable row level security;

create policy "Users can view own purchases"
  on public.shop_purchases for select
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. Weekly Challenges Schema
-- -----------------------------------------------------------------------------
create table if not exists public.weekly_challenges (
  id                    uuid primary key default gen_random_uuid(),
  week_number           integer     not null,
  week_start_date       timestamptz not null,
  week_end_date         timestamptz not null,
  title                 text        not null,
  description           text        not null,
  requirement_type      text        not null check (requirement_type in ('category_count', 'total_count')),
  target_category       text        check (target_category in ('Body', 'Mind', 'Discipline', 'Craft', 'Spirit')),
  target_count          integer     not null check (target_count > 0),
  reward_rare_currency  integer     not null check (reward_rare_currency > 0),
  is_active             boolean     not null default true,
  created_at            timestamptz not null default now()
);

create index if not exists idx_weekly_challenges_active
  on public.weekly_challenges(is_active, week_start_date, week_end_date);

alter table public.weekly_challenges enable row level security;

create policy "Anyone authenticated can view active challenges"
  on public.weekly_challenges for select
  using (auth.uid() is not null);

create table if not exists public.weekly_challenge_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  challenge_id    uuid        not null references public.weekly_challenges(id) on delete cascade,
  current_count   integer     not null default 0 check (current_count >= 0),
  completed       boolean     not null default false,
  completed_at    timestamptz,
  claimed         boolean     not null default false,
  claimed_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, challenge_id)
);

create index if not exists idx_challenge_progress_user
  on public.weekly_challenge_progress(user_id, challenge_id);

alter table public.weekly_challenge_progress enable row level security;

create policy "Users can view own challenge progress"
  on public.weekly_challenge_progress for select
  using (auth.uid() = user_id);

create policy "Users can update own challenge progress"
  on public.weekly_challenge_progress for update
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. Atomic RPC: purchase_item_v1
-- -----------------------------------------------------------------------------
create or replace function public.purchase_item_v1(
  p_item_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id             uuid;
  v_profile             public.profiles%rowtype;
  v_item                public.shop_items%rowtype;
  v_existing_purchase   public.shop_purchases%rowtype;
  v_already_owned       boolean;
  v_balance             integer;
  v_new_balance         integer;
  v_inventory_id        uuid;
begin
  -- 1. Input Validation
  if p_item_id is null then
    raise exception 'Item ID is required' using errcode = '22023';
  end if;

  if p_idempotency_key is null then
    raise exception 'Idempotency key is required' using errcode = '22023';
  end if;

  -- 2. Authenticate Caller
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED: Authentication required' using errcode = '42501';
  end if;

  -- 3. Row Lock Profile (Serializes currency deductions)
  select * into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if v_profile.id is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  -- 4. Idempotency Check: Has this purchase already been processed?
  select * into v_existing_purchase
  from public.shop_purchases
  where user_id = v_user_id and idempotency_key = p_idempotency_key;

  if v_existing_purchase.id is not null then
    return jsonb_build_object(
      'success', true,
      'is_duplicate', true,
      'item_id', v_existing_purchase.item_id,
      'soft_currency', v_profile.soft_currency,
      'rare_currency', v_profile.rare_currency,
      'purchased_at', v_existing_purchase.created_at
    );
  end if;

  -- 5. Retrieve Real Item from Database (Never trust client)
  select * into v_item
  from public.shop_items
  where id = p_item_id;

  if v_item.id is null then
    raise exception 'Item not found' using errcode = 'P0002';
  end if;

  if not coalesce(v_item.active, false) then
    raise exception 'Item is no longer available for purchase' using errcode = '22000';
  end if;

  -- 6. Enforce Duplicate Ownership Rule (Cosmetics cannot be owned twice)
  select exists(
    select 1 from public.inventory
    where user_id = v_user_id and item_id = p_item_id
  ) into v_already_owned;

  if v_already_owned then
    raise exception 'You already own this cosmetic item' using errcode = '23505';
  end if;

  -- 7. Retrieve Actual User Balance & Verify Sufficient Funds
  if lower(coalesce(v_item.currency_type, 'soft')) = 'rare' then
    v_balance := v_profile.rare_currency;
    if v_balance < v_item.cost then
      raise exception 'INSUFFICIENT_FUNDS: Not enough rare currency (Starlight Embers)' using errcode = '22003';
    end if;
    v_new_balance := v_balance - v_item.cost;

    update public.profiles
    set rare_currency = v_new_balance,
        updated_at = now()
    where id = v_user_id;

    v_profile.rare_currency := v_new_balance;
  else
    v_balance := v_profile.soft_currency;
    if v_balance < v_item.cost then
      raise exception 'INSUFFICIENT_FUNDS: Not enough Star Dust' using errcode = '22003';
    end if;
    v_new_balance := v_balance - v_item.cost;

    update public.profiles
    set soft_currency = v_new_balance,
        updated_at = now()
    where id = v_user_id;

    v_profile.soft_currency := v_new_balance;
  end if;

  -- 8. Insert Inventory Record
  insert into public.inventory (user_id, item_id, equipped, acquired_at)
  values (v_user_id, p_item_id, false, now())
  returning id into v_inventory_id;

  -- 9. Record Purchase Ledger to Consume Idempotency Key
  insert into public.shop_purchases (
    user_id, item_id, cost, currency_type, idempotency_key, created_at
  ) values (
    v_user_id, p_item_id, v_item.cost, coalesce(v_item.currency_type, 'soft'), p_idempotency_key, now()
  );

  -- 10. Return Authoritative State
  return jsonb_build_object(
    'success', true,
    'is_duplicate', false,
    'inventory_id', v_inventory_id,
    'item_id', p_item_id,
    'item_name', v_item.name,
    'cost', v_item.cost,
    'currency_type', coalesce(v_item.currency_type, 'soft'),
    'soft_currency', v_profile.soft_currency,
    'rare_currency', v_profile.rare_currency,
    'purchased_at', now()
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Atomic RPC: equip_cosmetic_v1
-- -----------------------------------------------------------------------------
create or replace function public.equip_cosmetic_v1(
  p_inventory_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id       uuid;
  v_inv           public.inventory%rowtype;
  v_item          public.shop_items%rowtype;
  v_new_equipped  boolean;
begin
  -- 1. Authenticate Caller
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED: Authentication required' using errcode = '42501';
  end if;

  -- 2. Validate Ownership
  select * into v_inv
  from public.inventory
  where id = p_inventory_id and user_id = v_user_id;

  if v_inv.id is null then
    raise exception 'Item not found in your inventory' using errcode = 'P0002';
  end if;

  -- 3. Retrieve Item Category
  select * into v_item
  from public.shop_items
  where id = v_inv.item_id;

  if v_inv.equipped then
    -- Unequip item
    update public.inventory
    set equipped = false
    where id = p_inventory_id;
    v_new_equipped := false;
  else
    -- Enforce single-item per equip slot / category
    update public.inventory i
    set equipped = false
    from public.shop_items s
    where i.item_id = s.id
      and i.user_id = v_user_id
      and s.category = v_item.category
      and i.id != p_inventory_id;

    update public.inventory
    set equipped = true
    where id = p_inventory_id;
    v_new_equipped := true;
  end if;

  return jsonb_build_object(
    'success', true,
    'inventory_id', p_inventory_id,
    'item_id', v_inv.item_id,
    'category', v_item.category,
    'equipped', v_new_equipped
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Atomic RPC: claim_weekly_challenge_v1
-- -----------------------------------------------------------------------------
create or replace function public.claim_weekly_challenge_v1(
  p_challenge_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id         uuid;
  v_profile         public.profiles%rowtype;
  v_challenge       public.weekly_challenges%rowtype;
  v_progress        public.weekly_challenge_progress%rowtype;
  v_completions     integer;
  v_new_rare        integer;
begin
  -- 1. Authenticate Caller
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED: Authentication required' using errcode = '42501';
  end if;

  -- 2. Row Lock Profile
  select * into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if v_profile.id is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  -- 3. Retrieve Challenge
  select * into v_challenge
  from public.weekly_challenges
  where id = p_challenge_id and is_active = true;

  if v_challenge.id is null then
    raise exception 'Weekly challenge not found or inactive' using errcode = 'P0002';
  end if;

  -- 4. Check Existing Progress
  select * into v_progress
  from public.weekly_challenge_progress
  where user_id = v_user_id and challenge_id = p_challenge_id
  for update;

  if v_progress.id is not null and v_progress.claimed then
    raise exception 'Challenge reward already claimed' using errcode = '23505';
  end if;

  -- 5. Count Authoritative Completions from task_completions
  if v_challenge.requirement_type = 'category_count' then
    select count(*) into v_completions
    from public.task_completions
    where user_id = v_user_id
      and lower(category) = lower(v_challenge.target_category)
      and completed_at >= v_challenge.week_start_date;
  else
    select count(*) into v_completions
    from public.task_completions
    where user_id = v_user_id
      and completed_at >= v_challenge.week_start_date;
  end if;

  if v_completions < v_challenge.target_count then
    raise exception 'Challenge requirement not met (% / % completed)' using errcode = '22000';
  end if;

  -- 6. Update or Insert Progress
  if v_progress.id is null then
    insert into public.weekly_challenge_progress (
      user_id, challenge_id, current_count, completed, completed_at, claimed, claimed_at
    ) values (
      v_user_id, p_challenge_id, v_completions, true, now(), true, now()
    );
  else
    update public.weekly_challenge_progress
    set current_count = v_completions,
        completed = true,
        completed_at = coalesce(completed_at, now()),
        claimed = true,
        claimed_at = now(),
        updated_at = now()
    where id = v_progress.id;
  end if;

  -- 7. Award Rare Currency Only
  v_new_rare := v_profile.rare_currency + v_challenge.reward_rare_currency;

  update public.profiles
  set rare_currency = v_new_rare,
      updated_at = now()
  where id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'rare_currency_awarded', v_challenge.reward_rare_currency,
    'rare_currency', v_new_rare,
    'claimed_at', now()
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. Seed Default Cosmetic Shop Items
-- -----------------------------------------------------------------------------
insert into public.shop_items (id, name, description, cost, currency_type, category, active)
values
  -- Sky Overlays
  ('11111111-1111-1111-1111-111111111101', 'Aurora Borealis Overlay', 'Atmospheric green and violet curtains illuminating your star map', 120, 'soft', 'sky_overlay', true),
  ('11111111-1111-1111-1111-111111111102', 'Nebular Void Overlay', 'Deep cosmic dust cloud with resonant ultraviolet starlight', 25, 'rare', 'sky_overlay', true),

  -- Star Colors
  ('22222222-2222-2222-2222-222222222201', 'Supernova Gold Luminary', 'Pure solar gold emission for completed star nodes', 80, 'soft', 'star_color', true),
  ('22222222-2222-2222-2222-222222222202', 'Starlight Cyan Luminary', 'Cold crystalline cyan starlight for high-altitude navigation', 15, 'rare', 'star_color', true),
  ('22222222-2222-2222-2222-222222222203', 'Solar Amber Luminary', 'Deep radiant amber glow with enhanced astrolabe harmonics', 60, 'soft', 'star_color', true),

  -- Avatar Frames
  ('33333333-3333-3333-3333-333333333301', 'Astrolabe Brass Frame', 'Engraved brass navigational dial with quadrant markers', 150, 'soft', 'avatar_frame', true),
  ('33333333-3333-3333-3333-333333333302', 'Celestial Orbit Frame', 'Rotating dual-ring orbital guide forged from star iron', 30, 'rare', 'avatar_frame', true),

  -- Constellation Styles
  ('44444444-4444-4444-4444-444444444401', 'Geometric Vector Style', 'Crisp technical drafting lines between charted celestial nodes', 100, 'soft', 'constellation_style', true),
  ('44444444-4444-4444-4444-444444444402', 'Pulsing Stardust Style', 'Warm incandescent astral thread binding major luminaries', 40, 'rare', 'constellation_style', true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  cost = excluded.cost,
  currency_type = excluded.currency_type,
  category = excluded.category,
  active = excluded.active;

-- -----------------------------------------------------------------------------
-- 8. Seed Default Weekly Challenges
-- -----------------------------------------------------------------------------
insert into public.weekly_challenges (
  id, week_number, week_start_date, week_end_date, title, description,
  requirement_type, target_category, target_count, reward_rare_currency, is_active
) values
  (
    '55555555-5555-5555-5555-555555555501',
    date_part('week', now())::integer,
    date_trunc('week', now()),
    date_trunc('week', now()) + interval '7 days',
    'Way of Discipline',
    'Complete 5 Discipline quests to reinforce your habits.',
    'category_count',
    'Discipline',
    5,
    15,
    true
  ),
  (
    '55555555-5555-5555-5555-555555555502',
    date_part('week', now())::integer,
    date_trunc('week', now()),
    date_trunc('week', now()) + interval '7 days',
    'Scholastic Ascent',
    'Complete 4 Mind quests to expand intellectual territory.',
    'category_count',
    'Mind',
    4,
    12,
    true
  ),
  (
    '55555555-5555-5555-5555-555555555503',
    date_part('week', now())::integer,
    date_trunc('week', now()),
    date_trunc('week', now()) + interval '7 days',
    'Astral Expedition',
    'Complete 7 total quests across any discipline quadrant.',
    'total_count',
    null,
    7,
    20,
    true
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  target_count = excluded.target_count,
  reward_rare_currency = excluded.reward_rare_currency,
  is_active = excluded.is_active;
