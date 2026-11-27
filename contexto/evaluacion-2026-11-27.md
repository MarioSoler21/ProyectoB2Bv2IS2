# Evaluación comercial de Pedidly: síntesis de 10 roles

## 1. Resumen ejecutivo

- **Hoy no lo pagaría ninguno de los 10 roles.** Como portal de pedidos con hoja de carga, el máximo que pagarían es USD 30-50 al mes.
- **Con las correcciones que piden, lo pagarían 9 de 10**: entre USD 60 y 200 al mes por distribuidora, con la mayoría entre 100 y 150. El vendedor propone además USD 8-12 por vendedor al mes. El cliente final no paga, pero dejaría WhatsApp por el portal.
- **Lo que bloquea la venta:** no hay permisos por rol, el dashboard llama "ventas" a pedidos sin despachar, editar un pedido le cambia el precio, la cartera por vendedor no está en el código y el stock no se mueve.
- **Lo que vende:** el portal del cliente por link (pedido sugerido y varios días en un envío), el tablero de despacho con deshacer, los precios calculados en el servidor y la marca propia por empresa.
- **Antes de construir crédito o inventario** hay que cerrar la seguridad por rol y la integridad del pedido.

## 2. Veredictos por rol

| Rol | ¿Pagaría hoy? | Con mejoras | Frase clave |
|---|---|---|---|
| Dueño / gerente | No (máx. USD 40-50) | USD 120-150 al mes | "Me muestra cuánto se pidió, no cuánto vendí, gané o me deben." |
| Vendedor de ruta | No | USD 8-12 por vendedor al mes | "El portal del cliente es mejor que mi herramienta; tomo el pedido más rápido por WhatsApp." |
| Jefe de despacho | No | USD 40-60, hasta 100-150 al mes | "El PDF mezcla varios días y no dice qué bajar en cada parada." |
| Bodeguero | No (no hay módulo) | +USD 40-60 al mes | "Se vendieron 93 UCFL204 y el sistema dice que hay 50." |
| Cliente final | No paga | Usaría el portal cada semana | "Después de enviar no veo el total ni mis pedidos anteriores." |
| Contador / cobranza | No (máx. USD 40-50) | USD 150-200 al mes | "Llama facturado a lo que no salió de bodega; no hay ISV." |
| Admin del sistema | No | USD 80-120 al mes | "Cualquier usuario es admin y los usuarios que creo no pueden entrar." |
| Comprador SaaS | Piloto USD 30-60 | USD 120-180 al mes | "No me puedo dar de alta ni cargar mis datos sin que el proveedor meta SQL." |
| Auditor de lógica | No | USD 60-90 al mes | "El ciclo de vida del pedido no cierra." |
| Analista de datos | No aparte | USD 30-50, hasta 80-100 con margen | "Es un resumen histórico sin período, sin vendedor ni zona." |

## 3. Cosas que no tienen sentido

Revisé en el código, solo leyendo, los 8 hallazgos de mayor impacto.

- **Los 8 se sostienen.** Los marco con [VERIFICADO].
- **Un matiz:** "Deshacer despacho" solo afecta pedidos que están en estado `despachado`, así que no deja revertir uno ya entregado. El problema real es que no tiene límite de tiempo y que el estado al que vuelve lo decide el navegador.
- **No descarté ninguno.**

| # | Problema | Roles | Evidencia |
|---|---|---|---|
| 1 | **No hay permisos por rol** [VERIFICADO]. `rol` solo se usa para mostrar la etiqueta. Ninguna página ni server action lo revisa, y `requireTenant()` solo comprueba que haya sesión. Un vendedor puede cambiar precios y costos, ver el dashboard, descargar todos los pedidos, anular, editar usuarios (incluso darse rol de admin) y cambiar el plan. `/home` dice "según tu rol" y muestra lo mismo a todos. | 6 (dueño, vendedor, admin, SaaS, auditor, analista) | `app/(dashboard)/layout.tsx:91` (único uso de `rol` en la UI); `lib/admin-action-utils.ts`; `components/dashboard-nav.tsx:17-24` |
| 2 | **"Ventas totales" y "Total facturado" suman pedidos pendientes** [VERIFICADO]. `ventasTotales` incluye todo lo que no está anulado y el gráfico dice "Total facturado por día", pero la app no emite facturas. De los L 324,023, solo unos L 114,000 (35%) salieron de bodega. Además es todo el histórico, sin selector de período. "Clientes activos" (14) es igual al total de clientes. | 6 (dueño, contador, SaaS, auditor, analista, bodega) | `app/(dashboard)/dashboard/page.tsx:52-53, 187` |
| 3 | **Editar un pedido en despacho le cambia el precio a todas las líneas** [VERIFICADO]. `guardarEdicion` carga el precio con que se pidió cada línea y enseguida lo pisa con el precio actual del catálogo. Pasa aunque solo se cambie la nota. Las líneas se borran físicamente, no se escribe nada en `pedido_historial` y el descuento queda como monto fijo. | 5 (dueño, despacho, bodega, contador, auditor) | `lib/data/despacho.ts`: `precios.set(...catalogo...)` después de las líneas viejas; `.delete()` de `pedido_items`; `update` sin `registrarHistorial` |
| 4 | **La bitácora da por hecha la cartera por vendedor, pero el código no la tiene** [VERIFICADO]. `grep vendedor_id app lib` no encuentra nada y las migraciones terminan en `20260902100013` (no hay 014). `revision-comercial.md` dice "hecho (falta migrar)". `crearPedido` no guarda vendedor, zona ni fecha de entrega. | 6 (dueño, vendedor, contador, admin, auditor, analista) | `supabase/migrations/`; `app/(dashboard)/mis-clientes/actions.ts:41-51`; `contexto/bitacora.md:18-43` |
| 5 | **El stock nunca baja y la tarjeta "Stock bajo" da tranquilidad falsa** [VERIFICADO]. `movimientos_inventario` no aparece en ningún archivo de `app/` ni `lib/`. Se vendieron 93 UCFL204 contra un stock de 50. `/operador` es un texto de muestra que abre sin sesión. Admin dice "el stock se ajusta con movimientos", pero no hay pantalla para hacerlos. | 8 (todos menos el cliente y el analista explícito) | `grep movimientos_inventario` sin resultados; `dashboard/page.tsx:118-120, 334-336`; `app/operador/page.tsx` |
| 6 | **"Nuevo usuario" crea personas que no pueden entrar** [VERIFICADO]. `crearUsuario` solo inserta una fila en `usuarios`, sin correo, sin `auth_user_id` y sin invitación. El login busca por `auth_user_id`. El PIN se guarda en texto plano y llega al navegador: `listUsuarios` selecciona `pin` y el formulario lo usa como `defaultValue`. | 3 (admin, SaaS, bodega) | `app/(dashboard)/admin/usuarios/actions.ts:17-20`; `lib/data/admin.ts:80`; `usuario-dialog.tsx:66-70` |
| 7 | **El admin del tenant puede cambiarse el plan y el slug** [VERIFICADO]. `actualizarConfiguracion` hace `update` directo sobre `tenants` con `plan`. El plan hoy no limita nada. | 3 (admin, SaaS, auditor) | `admin/configuracion/actions.ts`; `config-form.tsx:54-58` |
| 8 | **"Deshacer despacho" no tiene límite de tiempo y el estado al que vuelve lo manda el cliente** [VERIFICADO, con matiz]. `restaurarEstados` acepta del navegador cualquier estado de `FLUJO_ESTADOS`. Solo filtra que el pedido esté en `despachado`, así que un pedido despachado hace una semana puede volver a pendiente y quedar editable. En la tarjeta, deshacer dura solo 10 s. Despachar es un clic sin confirmación. | 2 (auditor, despacho) | `lib/data/despacho.ts` (`restaurarEstados`); `lib/despacho/validacion.ts` (`estadosPreviosSchema`) |
| 9 | **Hay estados que nadie usa.** Ninguna acción pone `confirmado`, `en_preparacion` ni `entregado`. Despacho salta de cualquier estado a despachado. Los pedidos del vendedor nacen confirmados, sin revisión ni control de crédito. Los 6 "entregados" del demo vienen del seed y no tienen `entregado_at`. | 5 | `lib/data/despacho.ts:33-34`; `mis-clientes/actions.ts:47`; `supabase-repositorio.ts:155` |
| 10 | **Los pedidos no se crean de forma atómica.** Si fallan las líneas del pedido del vendedor, queda un pedido "confirmado" con total y sin líneas (el portal sí lo anula). Si en el portal falla el segundo día del carrito, el primero ya quedó grabado y al reintentar se duplica. La acción del vendedor no valida que el cliente sea del tenant ni que esté activo, y lee productos inactivos. | 4 (vendedor, contador, auditor, cliente) | `mis-clientes/actions.ts:16-23, 41-70`; `supabase-repositorio.ts:146-187` |
| 11 | **El PDF de carga mezcla varios días.** El filtro arranca en fecha "todas", el PDF no dice a qué día corresponde y no trae dirección, teléfono, notas ni líneas por cliente. | 2 (despacho, bodega) | `lib/despacho/filtros.ts:22-28`; `lib/despacho/pdf.ts` |
| 12 | **Hay dos reglas de stock y de decimales según el canal.** El vendedor tiene `max=stock` (solo en el HTML) y no acepta decimales. El portal acepta decimales para todo (hasta 2.5 rodamientos) y solo bloquea si el stock es 0. Ninguno valida en el servidor, y el portal expone el `stock_actual` exacto. | 4 | `mis-clientes/[clienteId]/pedido/page.tsx:85-94`; `selector-cantidad.tsx`; `borrador.ts:22-25` |
| 13 | **El cliente pierde de vista sus pedidos.** El portal no muestra precio ni total una vez enviado, y deja de mostrar los pedidos atrasados porque solo trae los que tienen entrega hoy o después. | 2 (cliente, auditor) | `tarjeta-pedido.tsx:36-56`; `supabase-repositorio.ts:95-103` |
| 14 | **Descargas no cuadra.** Abre en "Hoy" con 0 pedidos. El pie "Total" excluye anulados que sí aparecen en las filas. Promete "facturas PDF" que no existen. | 4 | `descargas-client.tsx:83-84, 99-101`; `home/page.tsx:52-53` |
| 15 | **Los datos del demo no son coherentes.** DIBSA vende rodamientos y tiene arroz, refrescos, pulperías, zonas duplicadas ("Norte" y "Zona Norte…") y "Ruta Bodega" como zona. 12 clientes tienen tipo `industrial`, que no existe en la lista del formulario: el selector aparece vacío al editar. 8 pedidos tienen entrega en domingo. | 9 | `/admin/productos`, `/admin/clientes`, `/admin/zonas`; `lib/validation/admin.ts:50-57` |
| 16 | **Se ve jerga técnica.** "tenant", "slug", "/pedidos/[token]/cliente", "Login por PIN (sin Supabase Auth)", "Está en uso por otras filas". | 2 | `home/page.tsx:47,67`; `admin/page.tsx:75`; `app/operador/page.tsx` |
| 17 | **El dashboard depende de la zona horaria del servidor.** Agrupa los días con la hora del servidor; en un hosting en UTC, un pedido de las 7 p. m. en Honduras cae en el día siguiente. Tampoco tiene paginación: Supabase corta en 1000 filas y los números dejarían de cuadrar sin aviso. | 3 | `dashboard/page.tsx:66-80`; `lib/data/reportes.ts:26-41` |

## 4. Lo que falta y es lógico añadir, priorizado

- **Esfuerzo:** S = menos de 2 días, M = hasta 1 semana, L = más de 1 semana.
- **"Ya estaba"** indica que el punto figura en `contexto/revision-comercial.md`.

| Prioridad | Qué | Impacto comercial | Esfuerzo | ¿Ya estaba? |
|---|---|---|---|---|
| 1 | Permisos por rol: matriz admin/gerente, vendedor, despacho y bodega; `requireRol()` en el layout y en cada action; menú filtrado; vendedor sin ver costos | Bloquea la venta (6 roles) | M | **NUEVO** |
| 2 | Integrar de verdad la cartera por vendedor (rama `feat/vendedor-en-pedido` y migración 014) y corregir la bitácora | Alto | S-M | Ya estaba (#7 y orden n.º 1, mal marcado como hecho) |
| 3 | Alta de usuarios por invitación de correo, recuperar contraseña, PIN hasheado, no dejar la empresa sin admin | Bloquea la venta | M | **NUEVO** |
| 4 | Dashboard honesto: separar en cartera, despachado y entregado; selector de período con comparación; agregados en SQL con zona horaria de Tegucigalpa | Alto | M | **NUEVO** |
| 5 | Pedido con integridad: RPC transaccional (vendedor y portal), clave de idempotencia, respetar el precio pactado al editar, historial de cambios de líneas | Alto | M | **NUEVO** (solo "auditoría de cambios de precio" estaba como pedido de un perfil) |
| 6 | Flujo del vendedor sobre los componentes del portal: buscador, total, fecha de entrega, notas, "repetir último pedido", historial del cliente, descuento con tope por rol | Alto | M | **NUEVO** |
| 7 | Ciclo de estados completo: confirmar (portal), preparar, despachar con chofer y camión, cerrar entrega (entregado, parcial o rechazado), reprogramar vencidos | Alto | M-L | Parcial: #12 (entregas parciales) y #6 (liquidación) estaban; reprogramar y manifiesto son **NUEVO** |
| 8 | Crédito y cuentas por cobrar con bloqueo a morosos | Muy alto (10/10 en la revisión previa) | L | Ya estaba (#1) |
| 9 | Inventario: salida al despachar (RPC con `referencia_id`), entradas y ajustes en `/operador`, stock comprometido contra disponible, kardex | Alto | L | Ya estaba (#2); comprometido, referencia de documento y faltantes son **NUEVO** |
| 10 | Calendario de reparto por zona, hora de corte, pedido mínimo | Medio-alto | M | Ya estaba como pedido de un perfil ("días de entrega por zona"); hora de corte y mínimo son **NUEVO** |
| 11 | ISV: gravado o exento por producto, aclarar si el precio lo incluye, desglose en el pedido | Alto (contador) | M | Ya estaba (#4, factura SAR); el ISV en el pedido antes de la factura es **NUEVO** |
| 12 | Hoja de entrega por cliente (líneas, dirección, teléfono, notas, firma) y carga de un solo día | Medio-alto | S-M | **NUEVO** |
| 13 | Portal: "Mis pedidos" con total y "pedir lo mismo", comprobante para compartir, cancelar o agregar mientras esté pendiente, página de link inválido con contacto | Medio-alto | M | **NUEVO** |
| 14 | Margen bruto: guardar `costo_unitario` por línea y ranking por utilidad | Medio-alto | M | Ya estaba (#9) |
| 15 | Reportes por vendedor, zona y origen (portal o vendedor); clientes en riesgo; CSV con detalle por línea | Alto (dueño y analista) | M | Parcial (#7); clientes en riesgo y CSV por línea son **NUEVO** |
| 16 | Importar y exportar catálogo y clientes desde Excel; onboarding con lista de pasos | Alto para vender | M | Ya estaba como pedido de un perfil (importar); onboarding es **NUEVO** |
| 17 | Plan de solo lectura, suspender tenants que no pagan (validar `tenants.activo` en el portal), panel del proveedor | Medio (modelo SaaS) | M | **NUEVO** |
| 18 | Ficha de cliente con RTN, razón social, condición de pago, vendedor y días de visita; producto con marca, código alterno y foto | Medio | S-M | Parcial (#4) |
| 19 | Listas de precios, avisos por WhatsApp, unidades con conversión | Alto | L | Ya estaban (#3, #5, #8) |

## 5. Quick wins (menos de un día cada uno)

1. Renombrar "Ventas totales" a "Pedidos ingresados" y "Total facturado" a "Total pedido", y agregar una tarjeta "Despachado/Entregado".
2. Ocultar la tarjeta "Stock bajo" o rotularla "sin movimientos registrados" mientras no haya inventario.
3. Quitar "facturas" de `/home` y la jerga técnica (tenant, slug, token, "Supabase Auth").
4. Abrir Descargas en "Este mes" y excluir los anulados del cuerpo del PDF/CSV, o mostrarlos aparte. Imprimir el período en el PDF.
5. Plan y slug de solo lectura en Configuración.
6. Dejar de devolver el `pin` en `listUsuarios`; mostrar "PIN configurado".
7. En `guardarEdicion`, usar el precio del catálogo solo para productos nuevos y escribir en `pedido_historial`.
8. En `restaurarEstados`, limitar por `despachado_at` (por ejemplo 15 min) y leer el estado previo en el servidor.
9. Que el pedido del vendedor filtre `activo=true`, valide el cliente y anule el pedido si fallan las líneas, como ya hace el portal.
10. Mostrar el monto en la tarjeta de despacho y el total en lempiras en el encabezado de cada día; ícono si el pedido tiene notas.
11. Botón "Enviar por WhatsApp" (wa.me) junto a "Copiar link" del portal, y confirmación antes de "Regenerar token".
12. Precio y subtotal por línea en "Tu pedido" del portal, y leyenda "precios con/sin ISV".
13. Bloquear o pedir confirmación para despachar una tarjeta (hoy es un clic); motivo obligatorio al anular.
14. Arreglar `/operador`: protegerlo o esconderlo.
15. Advertir cuando el precio es 0 o está por debajo del costo.
16. Limpiar el seed de DIBSA: solo rubro industrial, zonas sin duplicados, tipo de cliente válido, sin domingos.

## 6. Lo que está bien y hay que cuidar

- **Precios en el servidor:** se calculan en el servidor con snapshot de `precio_unitario`; el navegador nunca decide precio, tenant ni cliente. Lo mencionan 6 roles.
- **Pedidos que no se borran:** se anulan, tienen historial de estados y correlativos atómicos por tenant, la base que necesita el rango SAR. Los 40 pedidos cuadran (suma de líneas = subtotal, subtotal − descuento = total).
- **Portal del cliente:** link sin usuario, pedido sugerido, varios días en un envío, borrador local, zona horaria de Tegucigalpa, validación con zod y compensación ante fallos. Es el mejor componente de la app.
- **Tablero de despacho:** agrupa por día con avance real, filtra por ruta y "Sin ruta", despacha en lote cuidando la concurrencia, permite deshacer y saca el PDF consolidado por ruta.
- **Base multi-tenant:** todo filtra por `tenant_id`, se desactiva en lugar de borrar, el SKU es único por empresa y la marca propia (logo, colores con contraste) se aplica al portal.
- **Exportación:** CSV con BOM UTF-8, escape correcto y filtro por hora local.

## 7. Top 10 recomendado, en orden

1. **Permisos por rol** en layout, actions y menú. Sin esto nadie mete vendedores al sistema.
2. **Integrar la cartera por vendedor** (migración 014 y `vendedor_id` en el pedido) y corregir la bitácora y `revision-comercial.md`.
3. **Integridad del pedido:** RPC transaccional e idempotencia, precio pactado al editar con historial, validaciones del vendedor iguales a las del portal, deshacer con límite de tiempo.
4. **Dashboard honesto:** en cartera, despachado y entregado; período con comparación; agregados en SQL con zona horaria; ocultar "Stock bajo".
5. **Usuarios reales:** invitación por correo, recuperar contraseña, PIN hasheado, plan de solo lectura.
6. **Flujo del vendedor móvil** con los componentes del portal: buscador, total, fecha de entrega, notas, repetir último pedido, descuento con tope.
7. **Cerrar el ciclo del pedido:** confirmar, preparar, despachar con chofer, entregar o rechazar; reprogramar vencidos; hoja de entrega por cliente y carga de un día.
8. **Crédito y cuentas por cobrar** con bloqueo a morosos; depende de tener el estado "entregado".
9. **Inventario automático** (salida al despachar, entradas y ajustes en `/operador`, comprometido contra disponible) junto con el ISV en el pedido.
10. **Kit de venta:** demo limpia por rubro, importación desde Excel, onboarding, calendario de reparto con hora de corte, y reportes por vendedor y zona con clientes en riesgo.
