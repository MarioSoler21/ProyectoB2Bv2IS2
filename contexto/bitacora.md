# Bitácora

Lo más nuevo arriba. Cada entrada: qué se pidió → qué se hizo → cómo quedó.

---

## 2026-11-27

### Los 8 arreglos de la evaluación
- **Pedido:** "haz todos estos cambios" (los 8 hallazgos sin sentido de
  `evaluacion-2026-11-27.md`).
- **Hecho:**
  1. **Permisos por rol:** matriz única en `lib/auth/permisos.ts`;
     `exigirPermiso` (páginas) y `sesionConPermiso` (acciones) en
     `lib/auth/acceso.ts`. Admin todo; vendedor Mis clientes; despacho
     Despacho y Descargas. El menú muestra solo lo permitido. Plan e
     identificador de la empresa quedan de solo lectura.
  2. **Dashboard:** separa ingresado / despachado+entregado / por despachar,
     periodo 7/30/90 días, días en hora de Honduras, "clientes que pidieron X
     de Y activos", lee más de 1000 pedidos (paginado).
  3. **Editar en despacho:** las líneas conservan el precio pactado; solo los
     productos nuevos toman precio de catálogo; cada edición queda en
     `pedido_historial` con el detalle.
  4. **Cartera por vendedor:** `clientes.vendedor_id`, el vendedor ve solo lo
     suyo, el pedido guarda vendedor, zona y origen; Admin → Clientes asigna
     vendedor y avisa cuántos quedan sin asignar.
  5. **Stock:** despachar descuenta (salida), deshacer devuelve (entrada);
     Admin → Productos registra entradas y ajustes por conteo.
  6. **Usuarios:** el admin crea el acceso (correo + contraseña inicial) en
     Supabase Auth; PIN con bcrypt, nunca viaja al navegador; no se puede
     dejar la empresa sin admin activo.
  7. **Deshacer:** el servidor lee el estado anterior de `pedido_historial`,
     solo dentro de 15 minutos.
  8. **Ciclo completo:** confirmado → en preparación → despachado →
     entregado, con botón del paso siguiente y acciones en lote. Todo pasa
     por funciones Postgres atómicas (`cambiar_estado_pedidos`,
     `deshacer_estado_pedidos`, `registrar_movimiento_stock`).
  - Login de prueba con una cuenta demo por rol (`lib/auth/fake-login.ts`).
- **Migraciones:** `20261127100001_cliente_vendedor.sql` (aplicada en dev),
  `20261127100002_usuarios_acceso.sql` y
  `20261127100003_ciclo_pedido_inventario.sql` (falta aplicarlas).
- **Verificado:** `tsc` y `eslint` limpios; el SQL parsea con el parser de
  Postgres. En el navegador se probó permisos por rol y la cartera del
  vendedor. El ciclo de despacho, stock y usuarios queda por probar después
  de aplicar las migraciones.
- **Rama:** `feat/evaluacion-correcciones` (reemplaza a
  `feat/vendedor-en-pedido`, que se puede descartar).

### Evaluación comercial con 10 roles
- **Pedido:** 10 agentes que evalúen la app en local con lógica comercial: cosas
  sin sentido, cosas lógicas de añadir, sugerencias.
- **Hecho:** 10 roles (gerente, vendedor, despacho, bodega, cliente del portal,
  cobranza, admin, comprador SaaS, auditor de lógica, analista) recorrieron la
  app en localhost y el código, solo lectura. Un sintetizador verificó en el
  código los 8 hallazgos "sin sentido" de mayor impacto (los 8 se sostienen).
- **Resultado:** `evaluacion-2026-11-27.md`. Ninguno pagaría hoy; con arreglos,
  9/10 pagarían USD 60-200/mes. Lo más grave y nuevo: no hay permisos por rol,
  el dashboard llama "ventas" a pedidos no despachados, editar un pedido en
  despacho le cambia el precio, y la cartera por vendedor no está en el código.
- **Queda:** decidir el orden; el top 10 está al final del informe.

## 2026-11-26

### Carpeta de contexto
- **Pedido:** una carpeta con el contexto de las conversaciones (lo que se pide
  y lo que se hace), que se vaya actualizando, y subirla a git.
- **Hecho:** se creó `contexto/` (este archivo, `decisiones.md`,
  `pendientes.md`, `revision-comercial.md`, `README.md`) y una regla en
  `CLAUDE.md` para que Claude la lea al empezar y la actualice al terminar cada
  tarea.
- **Rama:** `docs/contexto`.

### Cartera por vendedor y vendedor en el pedido
- **Pedido:** empezar por el punto 1 del roadmap de la revisión comercial.
- **Problema encontrado:** el pedido que crea el vendedor no guardaba
  `vendedor_id` ni `zona_id`, y "Mis clientes" mostraba todos los clientes de
  la empresa. Sin eso no hay ventas por vendedor ni comisiones. Además se podía
  crear un pedido para cualquier cliente cambiando el id en la URL.
- **Hecho:**
  - Migración `supabase/migrations/20260902100014_cliente_vendedor.sql`:
    columna `clientes.vendedor_id` + índices.
  - `lib/data/catalogo.ts`: `getClientes(tenantId, vendedorId?)`,
    `getCartera(session)`, `vendedorDeCartera(session)`.
  - `/mis-clientes` y `/mis-clientes/[id]/pedido`: el rol `vendedor` ve solo su
    cartera; admin ve todo.
  - `app/(dashboard)/mis-clientes/actions.ts`: valida que el cliente sea del
    tenant, esté activo y (si es vendedor) sea suyo; guarda `vendedor_id`,
    `zona_id` y `origen` correcto.
  - Admin → Clientes: campo y columna "Vendedor"; la acción valida que sea un
    vendedor activo del mismo tenant.
  - Accesibilidad (revisión del agente de accesibilidad): `SelectField` ahora
    asocia la etiqueta con el combobox y el error con el campo; botón "Editar
    <negocio>"; celda vacía se lee "Sin asignar".
- **Verificado:** `tsc`, `eslint` y `next build` pasan. No hay tests en el
  proyecto. No se probó con datos reales.
- **Rama:** `feat/vendedor-en-pedido` (sin commit todavía).
- **Queda:** aplicar la migración en Supabase (sin ella las pantallas de
  clientes fallan) y asignar vendedores. Ver `pendientes.md`.

### Revisión comercial con 10 distribuidores
- **Pedido:** 10 agentes actuando como distribuidores que revisen qué falta o
  qué se podría agregar, sobre todo en la parte comercial.
- **Hecho:** 10 perfiles (bebidas, abarrotes a crédito, ferretería, lácteos,
  farmacéutica, snacks en ruta, licores, limpieza institucional, agroinsumos,
  distribuidora multi-bodega). Cada uno leyó el código y dio veredicto, precio
  dispuesto a pagar, faltantes y su "dealbreaker".
- **Resultado:** ninguno pagaría hoy; el faltante n.º 1 (10/10) es crédito y
  cuentas por cobrar. Todo en `revision-comercial.md`.

### Subir cambios pendientes de Pedidly
- **Pedido:** "subilo al repo todo" → se aclaró que eran los cambios de Pedidly.
- **Hecho:** commit `4ffe95f` en la rama `chore/fake-login-branding-y-docs`
  (no en `main`): `lib/data/admin.ts` (marca por defecto si Supabase falla con
  login de prueba), `PROYECTO.md` y `Claude outputs/`. Se revisó antes que no
  hubiera claves. Push hecho.
- **Queda:** abrir el PR a `main`.

### MiroFish (fuera de este repo)
- **Pedido:** descargar, instalar y explicar https://github.com/666ghj/MiroFish.
- **Hecho:** clonado e instalado en `C:\Users\mario\MiroFish` (fuera del repo y
  de OneDrive). `.env` creado desde la plantilla, sin claves.
- **Qué es:** motor de predicción con miles de agentes de IA que simulan una
  red social a partir de documentos "semilla" (basado en OASIS de CAMEL-AI).
  Licencia AGPL-3.0, consume muchos tokens.
- **Queda:** poner `LLM_API_KEY` y `ZEP_API_KEY` en su `.env` y correr
  `npm run dev`.
