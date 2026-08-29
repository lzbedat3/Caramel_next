create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin();
$$;

comment on function public.current_user_is_admin() is
  'Whether auth.uid() is listed in private.admin_users. Safe to call from the Data API.';

revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated, service_role;
