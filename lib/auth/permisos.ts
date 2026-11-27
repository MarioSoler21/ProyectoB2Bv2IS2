/**
 * Qué puede hacer cada rol. Es la única fuente de verdad: la usan el menú,
 * las páginas (lib/auth/acceso.ts) y las server actions. Ocultar un botón no
 * protege nada; lo que protege es que la página y la acción lo verifiquen.
 *
 * No importa nada del servidor: el menú (componente cliente) también lo usa.
 */

export const ROLES = [
  "admin",
  "vendedor",
  "despacho",
  "operador_bodega",
  "cliente_portal",
] as const;

export type Rol = (typeof ROLES)[number];

const PERMISOS = {
  /** Armar pedidos desde "Mis clientes". */
  tomar_pedidos: ["admin", "vendedor"],
  /** Ver la cartera completa (sin esto, solo los clientes asignados a uno). */
  ver_todos_los_clientes: ["admin"],
  /** Tablero de despacho: avanzar estados, editar y anular pedidos. */
  despachar: ["admin", "despacho"],
  /** Reportes descargables (PDF/CSV de pedidos). */
  descargar_reportes: ["admin", "despacho"],
  /** Métricas del negocio. */
  ver_dashboard: ["admin"],
  /** Usuarios, clientes, catálogo, stock, zonas y configuración. */
  administrar: ["admin"],
} as const satisfies Record<string, readonly Rol[]>;

export type Permiso = keyof typeof PERMISOS;

export function puede(rol: string, permiso: Permiso): boolean {
  return (PERMISOS[permiso] as readonly string[]).includes(rol);
}

/** Secciones del panel y el permiso que pide cada una (menú y accesos de /home). */
export const SECCIONES = [
  { href: "/mis-clientes", permiso: "tomar_pedidos" },
  { href: "/despacho", permiso: "despachar" },
  { href: "/admin", permiso: "administrar" },
  { href: "/dashboard", permiso: "ver_dashboard" },
  { href: "/descargas", permiso: "descargar_reportes" },
] as const satisfies readonly { href: string; permiso: Permiso }[];

export type HrefSeccion = (typeof SECCIONES)[number]["href"];

export function seccionesPermitidas(rol: string): HrefSeccion[] {
  return SECCIONES.filter((s) => puede(rol, s.permiso)).map((s) => s.href);
}

/** Dónde aterriza cada rol al entrar: su sección principal, o /home. */
export function inicioDeRol(rol: string): string {
  return seccionesPermitidas(rol)[0] ?? "/home";
}
