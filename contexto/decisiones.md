# Decisiones

Cada decisión: qué se decidió, por qué, y fecha. Si una decisión cambia, no se
borra: se marca como reemplazada y se agrega la nueva.

---

### Nunca commitear directo a `main` — 2026-11-26
Todo cambio va en una rama (`feat/…`, `fix/…`, `chore/…`, `docs/…`) y entra a
`main` por pull request. Así cada cambio se puede revisar y deshacer.

### Venta atribuida al vendedor del cliente cuando la carga el admin — 2026-11-26
Si un admin crea el pedido desde "Mis clientes", `pedidos.vendedor_id` toma el
vendedor asignado al cliente y `origen` queda en `admin`. Si lo crea un
vendedor, `vendedor_id` es él mismo y `origen` es `vendedor`.
**Por qué:** para comisiones y metas, la venta a un cliente de la cartera
cuenta para su vendedor aunque la cargue otra persona.

### El vendedor ve solo su cartera; el resto de roles ve todo — 2026-11-26
`getCartera(session)` filtra por `clientes.vendedor_id` solo si el rol es
`vendedor`. Un cliente sin vendedor asignado no lo ve ningún vendedor.
**Por qué:** es lo que pidieron las distribuidoras (control de cartera y
comisiones). Asignar clientes es responsabilidad del admin.

### Validar el vendedor en la app, no solo con la FK — 2026-11-26
La FK `clientes.vendedor_id → usuarios.id` no impide asignar un usuario de otra
empresa ni un usuario que no es vendedor. La acción del admin lo valida
(`validarVendedor` en `app/(dashboard)/admin/clientes/actions.ts`).
**Por qué:** las tablas son multiempresa y el admin usa el cliente
`service_role`, que se salta RLS.

### Cambios de UI pasan por revisión de accesibilidad — 2026-11-26
Un hook del proyecto exige que el agente de accesibilidad revise antes de
editar archivos de interfaz. Se respeta siempre.

### Proyectos externos fuera del repo y fuera de OneDrive — 2026-11-26
MiroFish se instaló en `C:\Users\mario\MiroFish`, no dentro de Pedidly.
**Por qué:** es otro proyecto, con licencia AGPL, y sus dependencias (~1 GB)
no deben sincronizarse con OneDrive ni mezclarse con este repo.

### Roadmap guiado por la revisión comercial — 2026-11-26
El orden de trabajo sale de `revision-comercial.md`: primero lo que piden más
distribuidoras y lo que tiene base en la BD.
