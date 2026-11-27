# Revisión comercial — 10 distribuidores

_Fecha: 2026-11-26. Hecha con 10 agentes de IA, cada uno con el perfil de un
tipo de distribuidora en Honduras, que leyeron el código de Pedidly (sin
modificarlo) y respondieron qué les falta para pagar por el producto._

## Veredicto

**Ninguno lo pagaría hoy.** Todos coinciden en que la toma de pedidos y el
despacho están bien resueltos, pero el sistema no controla el dinero: quién
debe, a qué precio se vende y qué sale de bodega.

| Distribuidora | Pagaría (USD/mes) si tuviera lo que pide | Dealbreaker |
|---|---|---|
| Bebidas y gaseosas (envases retornables) | 150–250 | Crédito por cliente + liquidación de ruta |
| Abarrotes a crédito | 250–400 | Límite de crédito que bloquee el pedido |
| Ferretería mayorista | 120–180 | Precios por cliente/volumen + varias unidades de medida |
| Lácteos y refrigerados | 120–180 | Lotes, vencimientos y devoluciones |
| Farmacéutica | 150–250 | Lotes con trazabilidad lote → cliente (retiros de ARSA) |
| Snacks, preventa en ruta | 150–200 | Funcionar sin internet |
| Licores | 120–180 | Listas de precio + promociones automáticas con vigencia |
| Limpieza institucional (B2B) | 120–180 | Factura SAR válida + control de crédito |
| Agroinsumos rural | 60–90 | Crédito a cosecha con bloqueo a morosos |
| Mediana, 3 bodegas | 250–350 | Multi-bodega real |

## Lo que ya vale
- Portal del cliente por enlace, con pedido sugerido: quita llamadas y WhatsApp.
- Tablero de despacho con PDF de carga consolidada por ruta.
- Pedidos que no se borran, numeración correlativa e historial de estados.
- Marca de la distribuidora en el portal; datos aislados por empresa.

## Lo que falta, por frecuencia

| # | Qué agregar | Lo piden | Dealbreaker para | Base existente |
|---|---|---|---|---|
| 1 | Crédito y cuentas por cobrar con bloqueo a morosos | 10/10 | 4 | Tablas `facturas`, `pagos` sin pantalla |
| 2 | Inventario que baja al despachar, entradas, validar stock | 8/10 | – | `movimientos_inventario` sin uso en el código |
| 3 | Listas de precios por cliente/volumen/contrato | 7/10 | 2 | Un solo `productos.precio` |
| 4 | Factura SAR (CAI, RTN, exento/gravado) | 7/10 | 1 | `facturas` con ISV, sin CAI/RTN |
| 5 | Avisos por WhatsApp | 9/10 | – | Nada |
| 6 | Cobro en ruta y liquidación del camión | 4/10 | 1 | `pagos`, `repartidor_id` |
| 7 | Cartera por vendedor, metas y comisiones | 4/10 | – | `pedidos.vendedor_id` (ya se llena, ver bitácora) |
| 8 | Unidades de venta con conversión (caja, fardo, quintal) | 5/10 | 1 | `unidad_medida` es texto |
| 9 | Margen real por producto/cliente/vendedor/ruta | 4/10 | – | `costo` existe; falta guardarlo por línea |
| 10 | Lotes y vencimientos (FEFO) | 3/10 | 2 | Nada |
| 11 | App sin conexión para el vendedor | 3/10 | 1 | Nada |
| 12 | Entregas parciales, devoluciones, prueba de entrega | 4/10 | – | Estado `entregado` sin pantalla |
| 13 | Promociones y bonificaciones (2x1, 10+1) | 3/10 | – | Solo descuento manual global |

**Pedidos por un solo perfil:** multi-bodega, envases retornables,
cotizaciones, orden de compra con aprobación del cliente, importar desde Excel,
check-in con GPS, días de entrega por zona, auditoría de cambios de precio.

## Orden de trabajo acordado
1. Vendedor en el pedido y cartera por vendedor — **hecho** (falta migrar).
2. Crédito y cobranza.
3. Inventario automático.
4. Listas de precios.
5. Factura SAR y WhatsApp.
