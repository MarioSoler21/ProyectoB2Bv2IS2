-- =============================================================================
-- 015 - acceso de usuarios: correo visible y PIN hasheado
-- =============================================================================
-- * usuarios.email: copia del correo de auth.users para listarlo en el panel
--   sin llamar a la Admin API por cada fila. La app lo mantiene al crear o
--   cambiar el acceso de un usuario.
-- * usuarios.pin pasa a guardarse hasheado con bcrypt (pgcrypto). Los PIN que
--   hubiera en texto plano se hashean aca. La app nunca vuelve a leer el valor:
--   solo si hay o no PIN.
-- Idempotente.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

alter table public.usuarios
  add column if not exists email text;

comment on column public.usuarios.email is
  'Correo con el que entra (copia de auth.users.email). Null para quien entra solo con PIN.';

comment on column public.usuarios.pin is
  'PIN hasheado con bcrypt (extensions.crypt). Nunca en texto plano.';

-- PIN en texto plano heredados -> bcrypt (los hashes bcrypt empiezan con $2).
update public.usuarios
set pin = extensions.crypt(pin, extensions.gen_salt('bf'))
where pin is not null and pin not like '$2%';

-- Fija (o borra, con p_pin null) el PIN de un usuario del tenant.
create or replace function public.fijar_pin_usuario(
  p_tenant_id bigint,
  p_usuario_id bigint,
  p_pin text
) returns void
language sql
set search_path = public
as $$
  update public.usuarios
  set pin = case
    when p_pin is null then null
    else extensions.crypt(p_pin, extensions.gen_salt('bf'))
  end
  where id = p_usuario_id and tenant_id = p_tenant_id;
$$;

-- Verifica un PIN (para el futuro login de bodega). true si coincide.
create or replace function public.verificar_pin_usuario(
  p_tenant_id bigint,
  p_usuario_id bigint,
  p_pin text
) returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select u.pin = extensions.crypt(p_pin, u.pin)
     from public.usuarios u
     where u.id = p_usuario_id and u.tenant_id = p_tenant_id and u.activo and u.pin is not null),
    false
  );
$$;

-- Solo el servidor (service_role) puede llamarlas; reciben el tenant por
-- parametro, asi que expuestas a anon/authenticated serian un hueco.
revoke all on function public.fijar_pin_usuario(bigint, bigint, text) from public, anon, authenticated;
revoke all on function public.verificar_pin_usuario(bigint, bigint, text) from public, anon, authenticated;
grant execute on function public.fijar_pin_usuario(bigint, bigint, text) to service_role;
grant execute on function public.verificar_pin_usuario(bigint, bigint, text) to service_role;

-- Para que PostgREST vea los cambios sin reiniciar.
notify pgrst, 'reload schema';
