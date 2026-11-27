# Pendientes

Ordenado por prioridad. Al terminar algo, sacarlo de acá y anotarlo en
`bitacora.md`.

_Última actualización: 2026-11-26_

## Urgente (bloquea lo ya hecho)
- [ ] **Aplicar la migración `20260902100014_cliente_vendedor.sql` en
  Supabase** (`supabase db push` o SQL Editor). Sin ella, Admin → Clientes y
  "Mis clientes" fallan porque piden la columna `vendedor_id`.
- [ ] **Asignar vendedor a cada cliente** en Admin → Clientes. Hasta entonces
  los vendedores no ven ningún cliente.
- [ ] Commit y PR de la rama `feat/vendedor-en-pedido`.
- [ ] Abrir el PR de la rama `chore/fake-login-branding-y-docs`.

## Roadmap comercial (de `revision-comercial.md`)
1. [x] ~~Vendedor en el pedido y cartera por vendedor~~ (rama
   `feat/vendedor-en-pedido`, falta migrar).
2. [ ] **Crédito y cuentas por cobrar**: límite y plazo por cliente, saldo,
   antigüedad (0-7, 8-15, 16-30, +30), bloqueo de pedidos a morosos con
   autorización del admin. Base: tablas `facturas` y `pagos` (migración 009).
3. [ ] **Inventario automático**: que despachar genere la salida en
   `movimientos_inventario` y baje el stock; pantalla de entradas y ajustes;
   no aceptar pedidos sin stock.
4. [ ] **Listas de precios** por tipo de cliente / volumen / contrato, con
   vigencia. Base: `clientes.tipo_cliente`.
5. [ ] **Factura SAR**: CAI, rango autorizado, fecha límite, RTN del cliente,
   producto exento/gravado.
6. [ ] **Avisos por WhatsApp**: pedido confirmado, despachado, saldo vencido.
7. [ ] Guardar el costo en `pedido_items` al vender (para margen histórico) y
   reporte de margen por producto/cliente/vendedor/ruta.
8. [ ] Metas y comisiones por vendedor (ya posible con `pedidos.vendedor_id`).

## Mejoras chicas detectadas
- [ ] El pedido del vendedor no guarda `fecha_entrega`: agregar selector de
  día como el del portal.
- [ ] Accesibilidad: los `Input` que usan `Field` no asocian el mensaje de
  error (`aria-describedby`); las celdas con "—" en Admin → Clientes (contacto,
  zona, tipo) deberían leerse con texto para lector de pantalla.
- [ ] La anulación de pedidos debería pedir un motivo; los cambios de precio
  no dejan registro (auditoría).
- [ ] El proyecto no tiene tests ni script `test` en `package.json`.
