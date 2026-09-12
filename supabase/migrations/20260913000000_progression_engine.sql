-- =============================================================================
-- Vivre: Server-Authoritative Atomic Progression Engine
-- Migration: 20260913000000_progression_engine.sql
-- =============================================================================
-- Function: complete_task_v1(p_task_id uuid, p_idempotency_key uuid)
-- Security: SECURITY DEFINER, search_path = ''
-- Access: Authenticated users only (auth.uid() authoritative resolution)
-- =============================================================================

create or replace function public.complete_task_v1(
  p_task_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id                 uuid;
  v_profile                 public.profiles%rowtype;
  v_task                    public.tasks%rowtype;
  v_existing                public.task_completions%rowtype;
  v_category                text;
  v_base_xp                 integer;
  v_multiplier              numeric;
  v_bonus_roll              text;
  v_awarded_xp              integer;
  v_rand_int                integer;
  v_timezone                text;
  v_local_today             date;
  v_daily_awarded_count     integer;
  v_is_capped               boolean := false;
  v_completion_id           uuid;
  v_completed_at            timestamptz;
  v_current_xp              integer;
  v_level                   integer;
  v_xp_to_next              integer;
  v_levels_gained           integer := 0;
  v_streak                  integer;
  v_longest                 integer;
  v_shield_avail            boolean;
  v_shield_refill           timestamptz;
  v_shield_consumed         boolean := false;
  v_last_day                date;
  v_day_diff                integer;
  v_new_attr_value          integer;
  v_existing_attr_value     integer;
begin
  -- ---------------------------------------------------------------------------
  -- 1. Input Validation
  -- ---------------------------------------------------------------------------
  if p_task_id is null then
    raise exception 'Task ID is required' using errcode = '22023';
  end if;

  if p_idempotency_key is null then
    raise exception 'Idempotency key is required' using errcode = '22023';
  end if;

  -- ---------------------------------------------------------------------------
  -- 2. Authoritative Caller Resolution
  -- ---------------------------------------------------------------------------
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED: Authentication required' using errcode = '42501';
  end if;

  -- ---------------------------------------------------------------------------
  -- 3. Row Lock Profile (Serializes all progression actions for this user)
  -- ---------------------------------------------------------------------------
  select * into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if v_profile.id is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  -- ---------------------------------------------------------------------------
  -- 4. Idempotency Check
  -- If same user sends same idempotency key: return deterministic response
  -- ---------------------------------------------------------------------------
  select * into v_existing
  from public.task_completions
  where user_id = v_user_id and idempotency_key = p_idempotency_key;

  if v_existing.id is not null then
    select coalesce(value, 0) into v_existing_attr_value
    from public.attributes
    where user_id = v_user_id and lower(name) = lower(v_existing.category);

    -- Calculate current level xp_to_next for display
    if v_profile.level <= 10 then
      v_xp_to_next := 50 + (v_profile.level * 25);
    elsif v_profile.level <= 50 then
      v_xp_to_next := round(50.0 * (v_profile.level::numeric ^ 1.5))::integer;
    else
      v_xp_to_next := round(50.0 * (v_profile.level::numeric ^ 1.5) * 0.6)::integer;
    end if;

    return jsonb_build_object(
      'success', true,
      'is_duplicate', true,
      'completion_id', v_existing.id,
      'task_id', v_existing.task_id,
      'category', v_existing.category,
      'xp_awarded', v_existing.xp_awarded,
      'bonus_roll', v_existing.bonus_roll,
      'level', v_profile.level,
      'current_xp', v_profile.current_xp,
      'xp_to_next', v_xp_to_next,
      'leveled_up', false,
      'levels_gained', 0,
      'current_streak', v_profile.current_streak,
      'longest_streak', v_profile.longest_streak,
      'streak_shield_available', v_profile.streak_shield_available,
      'streak_shield_refill_at', v_profile.streak_shield_refill_at,
      'shield_consumed', false,
      'attribute', jsonb_build_object(
        'name', v_existing.category,
        'value', coalesce(v_existing_attr_value, 0)
      ),
      'completed_at', v_existing.completed_at
    );
  end if;

  -- ---------------------------------------------------------------------------
  -- 5. Fetch and Validate Task
  -- ---------------------------------------------------------------------------
  select * into v_task
  from public.tasks
  where id = p_task_id
  for update;

  if v_task.id is null then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;

  if v_task.user_id <> v_user_id then
    raise exception 'UNAUTHORIZED: Task does not belong to user' using errcode = '42501';
  end if;

  if v_task.archived_at is not null then
    raise exception 'Task is archived' using errcode = '22000';
  end if;

  -- ---------------------------------------------------------------------------
  -- 6. Server-Authoritative Category Base XP Configuration
  -- Body: 10, Mind: 10, Discipline: 12, Craft: 12, Spirit: 10
  -- ---------------------------------------------------------------------------
  case lower(trim(v_task.category))
    when 'body' then
      v_base_xp := 10;
      v_category := 'Body';
    when 'mind' then
      v_base_xp := 10;
      v_category := 'Mind';
    when 'discipline' then
      v_base_xp := 12;
      v_category := 'Discipline';
    when 'craft' then
      v_base_xp := 12;
      v_category := 'Craft';
    when 'spirit' then
      v_base_xp := 10;
      v_category := 'Spirit';
    else
      raise exception 'Invalid task category: %', v_task.category using errcode = '22023';
  end case;

  -- ---------------------------------------------------------------------------
  -- 7. Timezone-Aware Daily Cap Check
  -- Maximum 3 XP-awarding completions per category per calendar day
  -- ---------------------------------------------------------------------------
  v_timezone := coalesce(nullif(trim(v_profile.timezone), ''), 'Asia/Kolkata');
  begin
    v_local_today := (now() at time zone v_timezone)::date;
  exception when others then
    v_timezone := 'Asia/Kolkata';
    v_local_today := (now() at time zone v_timezone)::date;
  end;

  select count(*) into v_daily_awarded_count
  from public.task_completions
  where user_id = v_user_id
    and lower(category) = lower(v_category)
    and (completed_at at time zone v_timezone)::date = v_local_today
    and xp_awarded > 0;

  if v_daily_awarded_count >= 3 then
    -- Hard maximum reached: record completion but award 0 XP
    v_is_capped := true;
    v_multiplier := 1.0;
    v_bonus_roll := 'capped';
    v_awarded_xp := 0;
  else
    v_is_capped := false;
    -- -------------------------------------------------------------------------
    -- 8. Server-Authoritative Secure Randomness Roll
    -- 70% base (1.0x), 25% x1.5, 5% x3
    -- -------------------------------------------------------------------------
    v_rand_int := (('x' || encode(extensions.gen_random_bytes(2), 'hex'))::bit(16)::integer) % 100;
    if v_rand_int < 70 then
      v_multiplier := 1.0;
      v_bonus_roll := 'base';
    elsif v_rand_int < 95 then
      v_multiplier := 1.5;
      v_bonus_roll := 'x1.5';
    else
      v_multiplier := 3.0;
      v_bonus_roll := 'x3';
    end if;

    v_awarded_xp := round(v_base_xp * v_multiplier)::integer;
  end if;

  -- ---------------------------------------------------------------------------
  -- 9. Insert Immutable Completion Ledger Row
  -- ---------------------------------------------------------------------------
  insert into public.task_completions (
    task_id,
    user_id,
    idempotency_key,
    xp_awarded,
    bonus_roll,
    category,
    completed_at
  ) values (
    p_task_id,
    v_user_id,
    p_idempotency_key,
    v_awarded_xp,
    v_bonus_roll,
    v_category,
    now()
  ) returning id, completed_at into v_completion_id, v_completed_at;

  -- ---------------------------------------------------------------------------
  -- 10. Atomically Calculate Level Progression & Overflows
  -- ---------------------------------------------------------------------------
  v_current_xp := v_profile.current_xp + v_awarded_xp;
  v_level := v_profile.level;
  v_levels_gained := 0;

  loop
    if v_level <= 10 then
      v_xp_to_next := 50 + (v_level * 25);
    elsif v_level <= 50 then
      v_xp_to_next := round(50.0 * (v_level::numeric ^ 1.5))::integer;
    else
      v_xp_to_next := round(50.0 * (v_level::numeric ^ 1.5) * 0.6)::integer;
    end if;

    if v_current_xp < v_xp_to_next then
      exit;
    end if;

    v_current_xp := v_current_xp - v_xp_to_next;
    v_level := v_level + 1;
    v_levels_gained := v_levels_gained + 1;
  end loop;

  -- ---------------------------------------------------------------------------
  -- 11. Update Matching Attribute
  -- ---------------------------------------------------------------------------
  if v_awarded_xp > 0 then
    insert into public.attributes (user_id, name, value)
    values (v_user_id, v_category, v_awarded_xp)
    on conflict (user_id, name)
    do update set value = public.attributes.value + excluded.value
    returning value into v_new_attr_value;
  else
    select coalesce(value, 0) into v_new_attr_value
    from public.attributes
    where user_id = v_user_id and lower(name) = lower(v_category);

    if v_new_attr_value is null then
      insert into public.attributes (user_id, name, value)
      values (v_user_id, v_category, 0)
      on conflict (user_id, name) do nothing
      returning value into v_new_attr_value;

      if v_new_attr_value is null then
        v_new_attr_value := 0;
      end if;
    end if;
  end if;

  -- ---------------------------------------------------------------------------
  -- 12. Update Streak and Streak Shield State
  -- ---------------------------------------------------------------------------
  v_streak := v_profile.current_streak;
  v_longest := v_profile.longest_streak;
  v_shield_avail := v_profile.streak_shield_available;
  v_shield_refill := v_profile.streak_shield_refill_at;
  v_shield_consumed := false;

  -- Deterministic refill check (refills after interval has passed)
  if v_shield_avail = false and v_shield_refill is not null and now() >= v_shield_refill then
    v_shield_avail := true;
    v_shield_refill := null;
  end if;

  if v_profile.last_completion_at is null then
    -- First completion ever
    v_streak := 1;
  else
    v_last_day := (v_profile.last_completion_at at time zone v_timezone)::date;
    v_day_diff := v_local_today - v_last_day;

    if v_day_diff = 0 then
      -- Same calendar day: preserve streak (ensure at least 1)
      if v_streak = 0 then
        v_streak := 1;
      end if;
    elsif v_day_diff = 1 then
      -- Consecutive calendar day: increment streak
      v_streak := v_streak + 1;
    elsif v_day_diff = 2 then
      -- Missed exactly one day
      if v_shield_avail = true then
        -- Consume shield, forgive missed day, increment streak
        v_shield_avail := false;
        v_shield_refill := now() + interval '7 days';
        v_shield_consumed := true;
        v_streak := v_streak + 1;
      else
        -- No shield available, reset streak to 1
        v_streak := 1;
      end if;
    elsif v_day_diff > 2 then
      -- Missed more than 1 day, reset streak to 1
      v_streak := 1;
    end if;
    -- If clock skew / day_diff < 0, preserve existing streak
  end if;

  v_longest := greatest(v_longest, v_streak);

  -- ---------------------------------------------------------------------------
  -- 13. Update Profile Authoritative State
  -- ---------------------------------------------------------------------------
  update public.profiles
  set level = v_level,
      current_xp = v_current_xp,
      current_streak = v_streak,
      longest_streak = v_longest,
      streak_shield_available = v_shield_avail,
      streak_shield_refill_at = v_shield_refill,
      last_completion_at = now()
  where id = v_user_id;

  -- ---------------------------------------------------------------------------
  -- 14. Return Authoritative Response Payload
  -- ---------------------------------------------------------------------------
  return jsonb_build_object(
    'success', true,
    'is_duplicate', false,
    'completion_id', v_completion_id,
    'task_id', p_task_id,
    'category', v_category,
    'base_xp', v_base_xp,
    'multiplier', v_multiplier,
    'bonus_roll', v_bonus_roll,
    'xp_awarded', v_awarded_xp,
    'is_capped', v_is_capped,
    'daily_category_completions', v_daily_awarded_count + (case when v_awarded_xp > 0 then 1 else 0 end),
    'level', v_level,
    'current_xp', v_current_xp,
    'xp_to_next', v_xp_to_next,
    'leveled_up', (v_levels_gained > 0),
    'levels_gained', v_levels_gained,
    'current_streak', v_streak,
    'longest_streak', v_longest,
    'streak_shield_available', v_shield_avail,
    'streak_shield_refill_at', v_shield_refill,
    'shield_consumed', v_shield_consumed,
    'attribute', jsonb_build_object(
      'name', v_category,
      'value', coalesce(v_new_attr_value, 0)
    ),
    'completed_at', v_completed_at
  );
end;
$$;

comment on function public.complete_task_v1 is 'Authoritative task completion engine executing atomically inside PostgreSQL.';

-- Restrict execution to authenticated users
revoke execute on function public.complete_task_v1(uuid, uuid) from public, anon;
grant execute on function public.complete_task_v1(uuid, uuid) to authenticated;
