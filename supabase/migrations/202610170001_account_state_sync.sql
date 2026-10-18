create table if not exists public.profile_states (user_id uuid primary key references auth.users(id) on delete cascade, revision integer not null default 0, payload jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
create table if not exists public.device_playback_states (user_id uuid not null references auth.users(id) on delete cascade, device_id uuid not null, revision integer not null default 0, payload jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now(), primary key (user_id,device_id));
alter table public.profile_states enable row level security;
alter table public.device_playback_states enable row level security;
create policy "own profile state" on public.profile_states for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own device playback" on public.device_playback_states for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create or replace function public.write_account_state(p_scope text,p_device_id uuid,p_revision integer,p_payload jsonb) returns jsonb language plpgsql security invoker as $$
declare current_revision integer; next_revision integer;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_scope='profile' then
    insert into public.profile_states(user_id) values(auth.uid()) on conflict (user_id) do nothing;
    select revision into current_revision from public.profile_states where user_id=auth.uid() for update;
    if current_revision<>p_revision then return jsonb_build_object('applied',false,'revision',current_revision); end if;
    next_revision:=current_revision+1;
    update public.profile_states set revision=next_revision,payload=p_payload,updated_at=now() where user_id=auth.uid();
    return jsonb_build_object('applied',true,'revision',next_revision);
  end if;
  if p_scope='device' and p_device_id is not null then
    insert into public.device_playback_states(user_id,device_id) values(auth.uid(),p_device_id) on conflict (user_id,device_id) do nothing;
    select revision into current_revision from public.device_playback_states where user_id=auth.uid() and device_id=p_device_id for update;
    if current_revision<>p_revision then return jsonb_build_object('applied',false,'revision',current_revision); end if;
    next_revision:=current_revision+1;
    update public.device_playback_states set revision=next_revision,payload=p_payload,updated_at=now() where user_id=auth.uid() and device_id=p_device_id;
    return jsonb_build_object('applied',true,'revision',next_revision);
  end if;
  raise exception 'invalid scope';
end $$;
