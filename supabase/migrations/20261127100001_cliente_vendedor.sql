-- =============================================================================
-- 014 - clientes.vendedor_id (cartera por vendedor)
-- =============================================================================
-- Cada cliente puede tener un vendedor asignado. El vendedor ve solo su
-- cartera; un cliente sin vendedor no lo ve ningun vendedor (solo el admin).
-- Idempotente: se puede correr mas de una vez sin romper nada.
-- =============================================================================

alter table public.clientes
  add column if not exists vendedor_id bigint references public.usuarios(id) on delete set null;

comment on column public.clientes.vendedor_id is
  'Vendedor (usuarios.rol = vendedor, mismo tenant) dueno de la cartera. La app valida rol y tenant; la FK no lo hace.';

-- "Mis clientes" del vendedor: where tenant_id = ? and vendedor_id = ?
create index if not exists idx_clientes_tenant_vendedor
  on public.clientes (tenant_id, vendedor_id);

-- Ventas y comisiones por vendedor (pedidos.vendedor_id ya existe desde 007).
create index if not exists idx_pedidos_tenant_vendedor
  on public.pedidos (tenant_id, vendedor_id);

-- Para que PostgREST vea los cambios sin reiniciar.
notify pgrst, 'reload schema';
