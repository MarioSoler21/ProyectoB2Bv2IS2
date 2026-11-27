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

### Matriz de permisos única, chequeada en el servidor — 2026-11-27
`lib/auth/permisos.ts` define qué puede cada rol; el menú y los guardas del
servidor leen la misma matriz. Cada página llama `exigirPermiso` y cada
acción `sesionConPermiso`, no basta con esconder el botón.
**Por qué:** el admin usa `service_role` (se salta RLS); sin chequeo en el
servidor un vendedor podía cambiar precios o hacerse admin.
(Reemplaza en parte "el resto de roles ve todo": ahora despacho no entra a
Mis clientes.)

### Cambios de estado y stock solo por funciones Postgres — 2026-11-27
`cambiar_estado_pedidos`, `deshacer_estado_pedidos` y
`registrar_movimiento_stock` hacen estado + historial + stock en una
transacción. Solo `service_role` puede llamarlas.
**Por qué:** que no quede un pedido despachado sin su salida de stock, ni un
deshacer elegido por el navegador.

### Deshacer lee el historial y vence a los 15 minutos — 2026-11-27
El estado al que vuelve un pedido sale de `pedido_historial`, nunca del
cliente. Pasados 15 minutos ya no se deshace (hay que anular o editar).

### Editar un pedido no cambia el precio pactado — 2026-11-27
Las líneas existentes conservan su precio; solo los productos agregados
toman el precio vigente del catálogo. Cada edición queda en el historial.

### Plan e identificador de empresa no los cambia el cliente — 2026-11-27
Se muestran de solo lectura en Configuración; los cambia el equipo de
Pedidly.

### PIN hasheado con bcrypt — 2026-11-27
`usuarios.pin` se guarda con `extensions.crypt`; la app solo sabe si hay PIN
o no. El acceso con correo vive en Supabase Auth y `usuarios.email` es copia
para listarlo.
