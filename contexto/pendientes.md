# Pendientes

Ordenado por prioridad. Al terminar algo, sacarlo de acá y anotarlo en
`bitacora.md`.

_Última actualización: 2026-11-27_

## Urgente (bloquea lo ya hecho)
- [ ] **Aplicar en Supabase `20261127100002_usuarios_acceso.sql` y
  `20261127100003_ciclo_pedido_inventario.sql`** (SQL Editor). Sin ellas
  Admin → Usuarios da error 500 y fallan los cambios de estado en despacho y
  los movimientos de stock.
- [ ] Después de migrar, probar en el navegador: ciclo de despacho completo,
  deshacer, que baje y vuelva el stock, editar pedido (precio + historial),
  crear usuario con correo y PIN, movimientos de stock, dashboard.
- [ ] Revisar y mergear el PR de `feat/evaluacion-correcciones`.
- [ ] Descartar la rama `feat/vendedor-en-pedido` (quedó dentro de
  `feat/evaluacion-correcciones`).
- [ ] **Asignar vendedor a cada cliente** en Admin → Clientes.
- [ ] Abrir el PR de la rama `chore/fake-login-branding-y-docs`.

## Roadmap comercial (de `revision-comercial.md`)
1. [x] ~~Vendedor en el pedido y cartera por vendedor~~ (rama
   `feat/evaluacion-correcciones`).
2. [ ] **Crédito y cuentas por cobrar**: límite y plazo por cliente, saldo,
   antigüedad (0-7, 8-15, 16-30, +30), bloqueo de pedidos a morosos con
   autorización del admin. Base: tablas `facturas` y `pagos` (migración 009).
3. [~] **Inventario automático**: ~~salida al despachar, entradas y
   ajustes~~ (hecho en `feat/evaluacion-correcciones`). Falta: no aceptar
   pedidos sin stock y un historial de movimientos por producto.
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
  del catálogo no dejan registro (las ediciones de pedidos ya sí).
- [ ] Login por PIN para bodega (ya existe `verificar_pin_usuario`).
- [ ] Reemplazar el login fake por Supabase Auth real en producción.
- [ ] El proyecto no tiene tests ni script `test` en `package.json`.
