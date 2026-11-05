\set ON_ERROR_STOP on
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com', '{"name":"Asha"}'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com', '{}');

do $$ begin
  assert (select count(*) from public.profiles) = 2, 'trigger should create profiles';
  assert (select name from public.profiles where email = 'a@example.com') = 'Asha', 'name copied from metadata';
end $$;

-- Quota functions as service role
set role service_role;
do $$
declare r boolean;
begin
  for i in 1..3 loop
    r := public.reserve_generation('11111111-1111-1111-1111-111111111111', '1970-01-01', 3);
    assert r, format('reservation %s should succeed', i);
  end loop;
  r := public.reserve_generation('11111111-1111-1111-1111-111111111111', '1970-01-01', 3);
  assert not r, '4th reservation must fail (free limit 3)';
  perform public.release_generation('11111111-1111-1111-1111-111111111111', '1970-01-01');
  assert (select generation_count from public.usage where user_id = '11111111-1111-1111-1111-111111111111') = 2, 'release decrements';
  r := public.reserve_generation('11111111-1111-1111-1111-111111111111', '1970-01-01', 3);
  assert r, 'can reserve again after release';
  -- separate billing period is counted separately
  r := public.reserve_generation('11111111-1111-1111-1111-111111111111', '2026-11-01', 60);
  assert r, 'new period starts fresh';
end $$;
insert into public.generations (user_id, tool, input_summary) values ('22222222-2222-2222-2222-222222222222', 'pitch', 'Pitch to X');
insert into public.subscriptions (user_id, plan, status) values ('22222222-2222-2222-2222-222222222222', 'plus', 'active');
reset role;

-- Signed-in user A
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
do $$ begin
  assert (select count(*) from public.profiles) = 1, 'A sees only own profile';
  assert (select count(*) from public.usage) = 2, 'A sees own usage rows';
  assert (select count(*) from public.subscriptions) = 0, 'A cannot see B subscription';
  assert (select count(*) from public.generations) = 0, 'A cannot see B generations';
end $$;

insert into public.generations (user_id, tool, input_summary) values ('11111111-1111-1111-1111-111111111111', 'reply', 'Reply · accept');
update public.generations set output = '{"x":1}'::jsonb, saved_at = now();
update public.profiles set history_enabled = false, name = 'Asha K';
delete from public.generations where user_id = '22222222-2222-2222-2222-222222222222';

-- Things A must NOT be able to do
do $$ begin
  begin
    insert into public.generations (user_id, tool) values ('22222222-2222-2222-2222-222222222222', 'reply');
    raise exception 'FAIL: inserted generation for another user';
  exception when insufficient_privilege then null; end;
  begin
    perform public.reserve_generation('11111111-1111-1111-1111-111111111111', '1970-01-01', 1000);
    raise exception 'FAIL: user called reserve_generation';
  exception when insufficient_privilege then null; end;
  begin
    perform public.release_generation('11111111-1111-1111-1111-111111111111', '1970-01-01');
    raise exception 'FAIL: user called release_generation';
  exception when insufficient_privilege then null; end;
  begin
    update public.usage set generation_count = 0;
    if found then raise exception 'FAIL: user reset own usage'; end if;
  exception when insufficient_privilege then null; end;
  begin
    insert into public.subscriptions (user_id, plan, status) values ('11111111-1111-1111-1111-111111111111', 'pro', 'active');
    raise exception 'FAIL: user granted themselves a subscription';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set email = 'x@y.z';
    raise exception 'FAIL: user changed email column';
  exception when insufficient_privilege then null; end;
  begin
    update public.generations set user_id = '22222222-2222-2222-2222-222222222222';
    raise exception 'FAIL: user reassigned generation';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

do $$ begin
  assert (select count(*) from public.generations where user_id = '22222222-2222-2222-2222-222222222222') = 1, 'B generation survived A delete';
  assert (select output is not null from public.generations where user_id = '11111111-1111-1111-1111-111111111111'), 'A saved output';
  assert (select history_enabled = false from public.profiles where email = 'a@example.com'), 'A toggled history';
  assert (select generation_count from public.usage where user_id = '11111111-1111-1111-1111-111111111111' and period_start = '1970-01-01') = 3, 'usage untouched by user';
end $$;

-- Anonymous users see nothing
set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$ begin
  assert (select count(*) from public.generations) = 0, 'anon sees no generations';
  assert (select count(*) from public.profiles) = 0, 'anon sees no profiles';
end $$;
reset role;

-- Account deletion cascades
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
do $$ begin
  assert (select count(*) from public.profiles where id = '11111111-1111-1111-1111-111111111111') = 0, 'profile deleted';
  assert (select count(*) from public.usage where user_id = '11111111-1111-1111-1111-111111111111') = 0, 'usage deleted';
  assert (select count(*) from public.generations where user_id = '11111111-1111-1111-1111-111111111111') = 0, 'generations deleted';
end $$;
select 'ALL DATABASE TESTS PASSED' as result;
