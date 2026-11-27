-- =============================================================================
-- 016 - ciclo de vida del pedido + inventario automatico
-- =============================================================================
-- Toda transicion de estado pasa por estas funciones, cada una en UNA
-- transaccion: el cambio de estado, su fila en pedido_historial y (al
-- despachar o deshacer un despacho) el movimiento de stock quedan juntos o no
-- queda nada.
--
--   pendiente -> confirmado -> en_preparacion -> despachado -> entregado
--   (se puede saltar hacia adelante: despachar un pendiente es valido)
--
-- * Despachar descuenta el stock (movimientos_inventario tipo 'salida').
-- * Deshacer lee el estado anterior de pedido_historial (nunca del navegador)
--   y solo dentro de una ventana de tiempo. Deshacer un despacho devuelve el
--   stock (tipo 'entrada').
-- * registrar_movimiento_stock: entradas de mercaderia y ajustes por conteo.
--
-- Son solo para el servidor (service_role): reciben el tenant por parametro.
-- Idempotente.
-- =============================================================================

alter table public.movimientos_inventario
  add column if not exists pedido_id bigint references public.pedidos(id);

comment on column public.movimientos_inventario.pedido_id is
  'Pedido que origino el movimiento (salida al despachar, entrada al deshacer). Null en entradas y ajustes manuales.';
comment on column public.movimientos_inventario.cantidad is
  'entrada/salida: cantidad positiva. ajuste: diferencia con signo (conteo - stock anterior).';

create index if not exists idx_movimientos_tenant_producto
  on public.movimientos_inventario (tenant_id, producto_id, created_at desc);
create index if not exists idx_pedido_historial_pedido
  on public.pedido_historial (pedido_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Interna: mueve el stock de todas las lineas de unos pedidos.
-- p_tipo 'salida' descuenta, 'entrada' devuelve.
-- -----------------------------------------------------------------------------
create or replace function public._mover_stock_de_pedidos(
  p_tenant_id bigint,
  p_pedido_ids bigint[],
  p_tipo text,
  p_usuario_id bigint,
  p_motivo text
) returns void
language plpgsql
set search_path = public
as $$
declare
  v_signo integer := case p_tipo when 'salida' then -1 when 'entrada' then 1 end;
begin
  if v_signo is null then
    raise exception 'Tipo de movimiento no permitido: %', p_tipo;
  end if;

  with lineas as (
    select i.pedido_id, i.producto_id, sum(i.cantidad) as cantidad
    from public.pedido_items i
    where i.tenant_id = p_tenant_id and i.pedido_id = any(p_pedido_ids)
    group by i.pedido_id, i.producto_id
  ), movimientos as (
    insert into public.movimientos_inventario
      (tenant_id, producto_id, tipo, cantidad, motivo, empleado_id, pedido_id)
    select p_tenant_id, l.producto_id, p_tipo, l.cantidad,
           p_motivo || ' #' || p.numero_pedido, p_usuario_id, l.pedido_id
    from lineas l
    join public.pedidos p on p.id = l.pedido_id
    returning producto_id, cantidad
  )
  update public.productos pr
  set stock_actual = pr.stock_actual + v_signo * t.cantidad
  from (
    select producto_id, sum(cantidad) as cantidad from movimientos group by producto_id
  ) t
  where pr.id = t.producto_id and pr.tenant_id = p_tenant_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Avanza pedidos a p_hacia. Solo toca los que estan en un estado anterior
-- valido (los demas se ignoran: ya avanzaron, o los anularon). Devuelve los
-- que cambiaron con su estado previo.
-- -----------------------------------------------------------------------------
create or replace function public.cambiar_estado_pedidos(
  p_tenant_id bigint,
  p_ids bigint[],
  p_hacia text,
  p_usuario_id bigint,
  p_comentario text
) returns table (id_pedido bigint, estado_previo text)
language plpgsql
set search_path = public
as $$
declare
  v_desde text[];
  v_ids bigint[];
  v_previos text[];
begin
  v_desde := case p_hacia
    when 'confirmado' then array['pendiente']
    when 'en_preparacion' then array['pendiente', 'confirmado']
    when 'despachado' then array['pendiente', 'confirmado', 'en_preparacion']
    when 'entregado' then array['despachado']
  end;
  if v_desde is null then
    raise exception 'Estado destino no permitido: %', p_hacia;
  end if;

  select coalesce(array_agg(s.id order by s.id), '{}'),
         coalesce(array_agg(s.estado order by s.id), '{}')
  into v_ids, v_previos
  from (
    select p.id, p.estado
    from public.pedidos p
    where p.tenant_id = p_tenant_id and p.id = any(p_ids) and p.estado = any(v_desde)
    for update
  ) s;

  if cardinality(v_ids) = 0 then
    return;
  end if;

  update public.pedidos p
  set estado = p_hacia,
      despachado_at  = case when p_hacia = 'despachado' then now() else p.despachado_at end,
      despachado_por = case when p_hacia = 'despachado' then p_usuario_id else p.despachado_por end,
      entregado_at   = case when p_hacia = 'entregado' then now() else p.entregado_at end
  where p.tenant_id = p_tenant_id and p.id = any(v_ids);

  insert into public.pedido_historial
    (tenant_id, pedido_id, estado_anterior, estado_nuevo, empleado_id, comentario)
  select p_tenant_id, u.id, u.previo, p_hacia, p_usuario_id, p_comentario
  from unnest(v_ids, v_previos) as u(id, previo);

  if p_hacia = 'despachado' then
    perform public._mover_stock_de_pedidos(p_tenant_id, v_ids, 'salida', p_usuario_id, 'Despacho pedido');
  end if;

  return query select u.id, u.previo from unnest(v_ids, v_previos) as u(id, previo);
end;
$$;

-- -----------------------------------------------------------------------------
-- Deshace el ultimo cambio a p_estado_actual de cada pedido, si fue hace menos
-- de p_ventana. El estado al que vuelve sale de pedido_historial.
-- -----------------------------------------------------------------------------
create or replace function public.deshacer_estado_pedidos(
  p_tenant_id bigint,
  p_ids bigint[],
  p_estado_actual text,
  p_usuario_id bigint,
  p_ventana interval default interval '15 minutes'
) returns table (id_pedido bigint, estado_restaurado text)
language plpgsql
set search_path = public
as $$
declare
  v_ids bigint[];
  v_previos text[];
begin
  if p_estado_actual not in ('confirmado', 'en_preparacion', 'despachado', 'entregado') then
    raise exception 'No se puede deshacer el estado %', p_estado_actual;
  end if;

  select coalesce(array_agg(s.id order by s.id), '{}'),
         coalesce(array_agg(s.anterior order by s.id), '{}')
  into v_ids, v_previos
  from (
    select p.id, h.estado_anterior as anterior
    from public.pedidos p
    cross join lateral (
      select hh.estado_anterior, hh.created_at
      from public.pedido_historial hh
      where hh.tenant_id = p_tenant_id
        and hh.pedido_id = p.id
        and hh.estado_nuevo = p_estado_actual
        -- las ediciones (mismo estado antes y despues) no son cambios de estado
        and hh.estado_anterior is distinct from hh.estado_nuevo
      order by hh.created_at desc, hh.id desc
      limit 1
    ) h
    where p.tenant_id = p_tenant_id
      and p.id = any(p_ids)
      and p.estado = p_estado_actual
      and h.created_at >= now() - p_ventana
      and h.estado_anterior in ('pendiente', 'confirmado', 'en_preparacion', 'despachado')
    for update of p
  ) s;

  if cardinality(v_ids) = 0 then
    return;
  end if;

  update public.pedidos p
  set estado = u.previo,
      despachado_at  = case when p_estado_actual = 'despachado' then null else p.despachado_at end,
      despachado_por = case when p_estado_actual = 'despachado' then null else p.despachado_por end,
      entregado_at   = case when p_estado_actual = 'entregado' then null else p.entregado_at end
  from unnest(v_ids, v_previos) as u(id, previo)
  where p.id = u.id and p.tenant_id = p_tenant_id;

  insert into public.pedido_historial
    (tenant_id, pedido_id, estado_anterior, estado_nuevo, empleado_id, comentario)
  select p_tenant_id, u.id, p_estado_actual, u.previo, p_usuario_id, 'Cambio deshecho'
  from unnest(v_ids, v_previos) as u(id, previo);

  if p_estado_actual = 'despachado' then
    perform public._mover_stock_de_pedidos(p_tenant_id, v_ids, 'entrada', p_usuario_id, 'Despacho deshecho, pedido');
  end if;

  return query select u.id, u.previo from unnest(v_ids, v_previos) as u(id, previo);
end;
$$;

-- -----------------------------------------------------------------------------
-- Entrada de mercaderia (suma p_cantidad) o ajuste por conteo fisico (el stock
-- pasa a ser p_cantidad; se guarda la diferencia). Devuelve el stock nuevo.
-- -----------------------------------------------------------------------------
create or replace function public.registrar_movimiento_stock(
  p_tenant_id bigint,
  p_producto_id bigint,
  p_tipo text,
  p_cantidad numeric,
  p_motivo text,
  p_usuario_id bigint
) returns numeric
language plpgsql
set search_path = public
as $$
declare
  v_actual numeric;
  v_delta numeric;
begin
  select stock_actual into v_actual
  from public.productos
  where id = p_producto_id and tenant_id = p_tenant_id
  for update;
  if not found then
    raise exception 'Producto no encontrado';
  end if;

  if p_tipo = 'entrada' then
    if p_cantidad <= 0 then
      raise exception 'La cantidad de una entrada debe ser mayor a cero';
    end if;
    v_delta := p_cantidad;
  elsif p_tipo = 'ajuste' then
    if p_cantidad < 0 then
      raise exception 'El conteo no puede ser negativo';
    end if;
    v_delta := p_cantidad - v_actual;
  else
    raise exception 'Tipo de movimiento no permitido: %', p_tipo;
  end if;

  insert into public.movimientos_inventario
    (tenant_id, producto_id, tipo, cantidad, motivo, empleado_id)
  values (p_tenant_id, p_producto_id, p_tipo, v_delta, p_motivo, p_usuario_id);

  update public.productos
  set stock_actual = v_actual + v_delta
  where id = p_producto_id and tenant_id = p_tenant_id;

  return v_actual + v_delta;
end;
$$;

-- Solo service_role.
revoke all on function public._mover_stock_de_pedidos(bigint, bigint[], text, bigint, text) from public, anon, authenticated;
revoke all on function public.cambiar_estado_pedidos(bigint, bigint[], text, bigint, text) from public, anon, authenticated;
revoke all on function public.deshacer_estado_pedidos(bigint, bigint[], text, bigint, interval) from public, anon, authenticated;
revoke all on function public.registrar_movimiento_stock(bigint, bigint, text, numeric, text, bigint) from public, anon, authenticated;
grant execute on function public._mover_stock_de_pedidos(bigint, bigint[], text, bigint, text) to service_role;
grant execute on function public.cambiar_estado_pedidos(bigint, bigint[], text, bigint, text) to service_role;
grant execute on function public.deshacer_estado_pedidos(bigint, bigint[], text, bigint, interval) to service_role;
grant execute on function public.registrar_movimiento_stock(bigint, bigint, text, numeric, text, bigint) to service_role;

-- Para que PostgREST vea columnas y funciones nuevas sin reiniciar.
notify pgrst, 'reload schema';
