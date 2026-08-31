-- Per-user AI rate limiting: 10 requests / 60 seconds.
-- The RPC runs with SECURITY DEFINER so the counter cannot be bypassed by
-- manipulating client-visible tables.
create table if not exists public.ai_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.ai_rate_limits enable row level security;

revoke all on public.ai_rate_limits from anon, authenticated;

drop function if exists public.check_ai_rate_limit(integer, integer);
create or replace function public.check_ai_rate_limit(
  p_limit integer default 10,
  p_window_seconds integer default 60
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_started timestamptz;
  v_count integer;
begin
  if v_user is null then
    return jsonb_build_object('allowed', false, 'code', 'UNAUTHENTICATED');
  end if;

  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.ai_rate_limits(user_id, window_started_at, request_count, updated_at)
  values (v_user, v_now, 1, v_now)
  on conflict (user_id) do update
    set window_started_at = case
          when v_now - public.ai_rate_limits.window_started_at >= make_interval(secs => p_window_seconds)
            then v_now
          else public.ai_rate_limits.window_started_at
        end,
        request_count = case
          when v_now - public.ai_rate_limits.window_started_at >= make_interval(secs => p_window_seconds)
            then 1
          else public.ai_rate_limits.request_count + 1
        end,
        updated_at = v_now
  returning window_started_at, request_count into v_started, v_count;

  if v_count > p_limit then
    return jsonb_build_object(
      'allowed', false,
      'code', 'RATE_LIMITED',
      'count', v_count,
      'limit', p_limit,
      'retry_after_seconds', greatest(1, ceil(extract(epoch from (v_started + make_interval(secs => p_window_seconds) - v_now)))::integer)
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'count', v_count,
    'limit', p_limit,
    'remaining', greatest(0, p_limit - v_count)
  );
end;
$$;

revoke all on function public.check_ai_rate_limit(integer, integer) from public;
grant execute on function public.check_ai_rate_limit(integer, integer) to authenticated;
