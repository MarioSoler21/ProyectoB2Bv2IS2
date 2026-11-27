# Pedidly — Plataforma de pedidos para distribuidoras

> Pedidos mayoristas sin llamadas ni WhatsApp: tus clientes piden desde un enlace y tu bodega despacha a tiempo.

---

## 1. La idea

### El problema
Muchas distribuidoras pequeñas y medianas (bebidas, abarrotes, ferretería, etc.) todavía toman los pedidos de sus clientes —pulperías, minimarkets, tiendas— por **llamada, WhatsApp o papel**. Eso trae:

- Errores al transcribir productos y cantidades.
- Pedidos que se pierden o se duplican.
- Bodega sin visibilidad de qué preparar ni para qué día.
- Cero datos para saber quién compra qué.

### La solución
**Pedidly** es una aplicación web **SaaS multiempresa**: una sola plataforma que usan muchas distribuidoras a la vez, cada una con su propio espacio aislado (catálogo, clientes, zonas, usuarios y marca).

- El **vendedor** levanta pedidos de su cartera de clientes.
- El **cliente** puede pedir solo, desde un **enlace personal** (sin crear cuenta).
- **Bodega / despacho** ve en un tablero qué hay que preparar por día y por ruta, y marca lo despachado.
- El **administrador** gestiona catálogo, clientes, zonas, usuarios y la marca de su empresa, y ve métricas.

### En una línea
App web para distribuidoras: sus clientes hacen pedidos desde un enlace o a través del vendedor, y la bodega los prepara y despacha desde un solo panel.

---

## 2. Usuarios y roles

| Rol | Qué hace |
|---|---|
| `admin` | Configura todo: catálogo, clientes, zonas, usuarios, marca. Ve métricas y reportes. |
| `vendedor` | Atiende su cartera de clientes ("Mis clientes") y crea pedidos para ellos. |
| `despacho` | Usa el tablero de despacho: prepara, despacha, edita o anula pedidos. |
| `operador_bodega` | Rol de bodega/inventario (pantalla `/operador`). |
| `cliente_portal` | El negocio cliente. Pide desde su enlace único `/pedidos/<token>/cliente`. |

Un mismo usuario puede pertenecer a **varias empresas** y cambiar de negocio activo sin volver a iniciar sesión.

---

## 3. Funcionalidades

### 3.1 Inicio de sesión — `/login`
- Correo + contraseña con Supabase Auth. **No hay registro público**: los usuarios los crea un administrador.
- **Login de prueba** para desarrollo local (sin Supabase): `admin@demo.com` / `demo1234`, activado con `NEXT_PUBLIC_FAKE_LOGIN_ENABLED=true`. Nunca se activa en producción.

### 3.2 Home — `/home`
Pantalla de bienvenida del panel con accesos a las secciones.

### 3.3 Mis clientes — `/mis-clientes`
- Cartera de clientes del vendedor.
- Crear un pedido nuevo para un cliente (`/mis-clientes/<id>/pedido`): buscador de productos, selector de cantidad (+ / −), líneas del pedido y totales.

### 3.4 Portal del cliente — `/pedidos/<token>/cliente`
El cliente entra con su **enlace único** (cada cliente tiene un `token_unico`), sin usuario ni contraseña.
- **Selector de día de entrega** (Hoy, Mañana, próximos días), calculado en la zona horaria del negocio.
- **Pedido sugerido**: "Te sugerimos este pedido", armado con la plantilla de ese día de la semana o con su último pedido (solo productos activos).
- **Buscador de productos** tolerante a errores de tipeo (coincidencia aproximada), agrupado por categoría.
- **Carrito** con total estimado y notas opcionales; permite armar pedidos para varios días.
- **Borrador guardado** en el navegador: si cierra la página, no pierde lo que llevaba.
- **Pedidos del día**: ve los que ya hizo.
- Lleva la **marca de la distribuidora** (logo y colores), no la de Pedidly.
- **Modo demo** sin base de datos: `PORTAL_DEMO_ENABLED=true` y abrir `/pedidos/demo/cliente`.

### 3.5 Tablero de despacho — `/despacho`
- Pedidos **agrupados por día**, con avance ("3/8 despachados") y color de alerta:
  - **Ámbar**: hoy, lo que hay que despachar ya.
  - **Rojo**: días pasados con pendientes (vencidos).
  - **Neutro**: próximos días o días pasados ya despachados.
- **Filtros**: fecha (todas, hoy, mañana, semana), estado (pendientes, despachados, todos), ruta/zona y otros filtros múltiples.
- **Selección múltiple** para despachar varios pedidos a la vez, con **deshacer**.
- **Detalle del pedido** en un diálogo: editar líneas, descuento y notas, o **anular**.
- **PDF de la lista de despacho**: por cada ruta, sus pedidos y la **carga consolidada** (cuánto de cada producto subir al camión).

### 3.6 Dashboard — `/dashboard`
Métricas de la empresa:
- Ventas totales, número de pedidos, ticket promedio y clientes activos.
- Ranking de clientes por total comprado y de productos por unidades vendidas.
- Productos debajo del stock mínimo configurado.

### 3.7 Descargas — `/descargas`
Exportar pedidos a PDF filtrando por rango de fechas (desde / hasta) o el histórico completo.

### 3.8 Administración — `/admin`
Panel con contadores y gestión (alta, edición, activar/desactivar) de:
- **Usuarios** y sus roles.
- **Clientes**: negocio, contacto, teléfono, dirección, zona, tipo, notas y enlace del portal.
- **Productos**: SKU, nombre, categoría, unidad de medida, precio, costo, stock actual y stock mínimo.
- **Categorías** de producto.
- **Zonas / rutas** de reparto.
- **Configuración / marca**: nombre de la app, subtítulo, logo, colores (primario, secundario, barra lateral) y mensaje del portal.

### 3.9 Estados de un pedido
```
pendiente → confirmado → en_preparacion → despachado → entregado
                     (en cualquier momento) → anulado
```
Cada pedido registra su origen: `vendedor`, `cliente_portal` o `admin`. Los números de pedido son **correlativos por empresa** (cada distribuidora empieza en 1).

### 3.10 Preparado en la base de datos (aún sin pantalla completa)
- **Inventario**: movimientos de entrada, salida y ajuste por producto.
- **Facturación**: facturas con correlativo, subtotal, ISV y total; estados emitida / pagada / anulada; detalle de factura y pagos.

---

## 4. Tecnología

| Capa | Herramienta |
|---|---|
| Framework | **Next.js 16** (App Router, Server Components, Server Actions, Turbopack) |
| UI | **React 19**, **Tailwind CSS 4**, **shadcn/ui** (Radix), íconos **lucide-react**, tema claro/oscuro con `next-themes`, notificaciones con `sonner` |
| Formularios y validación | `react-hook-form` + **zod** |
| Datos en el cliente | `@tanstack/react-query` |
| Base de datos y auth | **Supabase**: PostgreSQL, Auth y Row Level Security |
| PDF | `jspdf` + `jspdf-autotable` (se generan en el navegador) |
| Lenguaje | TypeScript |

---

## 5. Arquitectura

### Multiempresa: un solo esquema + RLS
- Todas las tablas de negocio llevan `tenant_id`.
- **Row Level Security** en PostgreSQL filtra automáticamente por empresa: aunque el código olvide un filtro, la base no deja ver datos de otra empresa.
- Un **trigger** completa el `tenant_id` al insertar, para que sea imposible crear filas sin empresa.
- El `tenant_id` del usuario viaja en su sesión (`app_metadata`, que solo puede escribir el servidor).
- Dar de alta una empresa nueva es **una fila** en `tenants`, no un despliegue nuevo.

Más detalle en [`README-arquitectura.md`](README-arquitectura.md).

### Capas en el código
- `app/`: pantallas y Server Actions (Next.js).
- `components/`: componentes visuales reutilizables (`ui/` = shadcn).
- `lib/data/`: lectura y escritura de datos.
- `lib/portal/`, `lib/despacho/`: reglas de negocio puras (fechas, filtros, borrador, validación, PDF).
- `lib/data/portal/`: **patrón Repository**, con una implementación para Supabase y otra demo en memoria.
- `lib/domain/`, `lib/aplicacion/`, `lib/infra/`: arquitectura hexagonal (puertos y adaptadores) para crear pedidos *(rama `feature/refactor-capas`)*.

### Modelo de datos (tablas principales)
`tenants`, `tenant_contadores`, `usuarios`, `zonas`, `clientes`, `categorias_producto`, `productos`, `pedidos`, `pedido_items`, `movimientos_inventario`, `facturas`, `detalle_factura`, `pagos`.

Migraciones en `supabase/migrations/`; datos de ejemplo (dos empresas: *Distribuidora Uno* y *Ferretería El Sol*) en `supabase/seed.sql`.

---

## 6. Cómo correrlo

```bash
git clone https://github.com/MarioSoler21/ProyectoB2Bv2IS2.git
cd ProyectoB2Bv2IS2
npm install
# Colocar el archivo .env.local (pedírselo al responsable del proyecto)
npm run dev
```
Abrir http://localhost:3000

### Variables de entorno (`.env.local`)
| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servidor (**secreta**, nunca compartir en público) |
| `NEXT_PUBLIC_FAKE_LOGIN_ENABLED` | `true` = login de prueba en local |
| `PORTAL_DEMO_ENABLED` | `true` = portal de cliente demo en `/pedidos/demo/cliente` |

---

## 7. Próximos pasos posibles
- Pantallas de **inventario** y **facturación** (las tablas ya existen).
- Notificaciones al cliente por WhatsApp o correo cuando su pedido se despacha.
- App móvil o PWA para vendedores en ruta.
- Seguimiento de entrega por repartidor (el pedido ya guarda `repartidor_id`).
- Planes de suscripción por empresa (la tabla `tenants` ya tiene `plan`).
