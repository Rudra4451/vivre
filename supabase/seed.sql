-- =============================================================================
-- Vivre: Production & Staging Demo Seed Data
-- =============================================================================
-- Clearly labeled demo account for QA, automated audits, and onboarding
-- Account: demo@vivre.app
-- Callsign: AtlasDemoPilot
-- Note: In Supabase Auth, password authentication or magic links can be used.
-- This script seeds the public profile and sample state.
-- =============================================================================

do $$
declare
  v_demo_id uuid := '00000000-0000-0000-0000-000000000001';
begin
  -- 1. Insert into auth.users if auth schema is writable (e.g. local supabase CLI)
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    insert into auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) values (
      v_demo_id,
      '00000000-0000-0000-0000-000000000000',
      'demo@vivre.app',
      crypt('VivrePilot2026!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"AtlasDemoPilot"}',
      now(),
      now(),
      'authenticated',
      'authenticated'
    ) on conflict (id) do nothing;
  end if;

  -- 2. Ensure Demo Profile exists
  insert into public.profiles (
    id,
    email,
    username,
    level,
    current_xp,
    soft_currency,
    rare_currency,
    current_streak,
    longest_streak,
    streak_shield_available,
    timezone,
    theme_preference,
    sound_enabled,
    calm_mode,
    notification_email_comeback,
    notification_email_weekly_recap
  ) values (
    v_demo_id,
    'demo@vivre.app',
    'AtlasDemoPilot',
    5,
    450,
    180,
    12,
    7,
    14,
    true,
    'UTC',
    'dark',
    true,
    false,
    true,
    true
  ) on conflict (id) do update set
    username = excluded.username,
    level = excluded.level,
    current_xp = excluded.current_xp,
    soft_currency = excluded.soft_currency,
    rare_currency = excluded.rare_currency,
    current_streak = excluded.current_streak,
    longest_streak = excluded.longest_streak;

  -- 3. Seed Demo Attributes (Radar Pentagon)
  insert into public.attributes (user_id, name, value)
  values
    (v_demo_id, 'Body', 45),
    (v_demo_id, 'Mind', 65),
    (v_demo_id, 'Discipline', 80),
    (v_demo_id, 'Craft', 55),
    (v_demo_id, 'Spirit', 70)
  on conflict (user_id, name) do update set
    value = excluded.value;

  -- 4. Seed Active Tasks for Demo Account
  insert into public.tasks (id, user_id, title, category, is_recurring)
  values
    ('aaaaaaaa-0000-0000-0000-000000000001', v_demo_id, 'Morning Solar Calibration & Sunlight', 'Body', true),
    ('aaaaaaaa-0000-0000-0000-000000000002', v_demo_id, 'Deep Astronomical Study & Journaling', 'Mind', true),
    ('aaaaaaaa-0000-0000-0000-000000000003', v_demo_id, 'First Hour Digital Silence & Focus', 'Discipline', true),
    ('aaaaaaaa-0000-0000-0000-000000000004', v_demo_id, 'Constellation Architecture Crafting', 'Craft', false),
    ('aaaaaaaa-0000-0000-0000-000000000005', v_demo_id, 'Evening Starlight Contemplation', 'Spirit', true)
  on conflict (id) do update set
    title = excluded.title,
    category = excluded.category;

end $$;
