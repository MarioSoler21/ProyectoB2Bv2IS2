import "server-only";

import { cookies } from "next/headers";

import type { Session } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Login de prueba con credenciales fijas, solo para desarrollo local
 * (NEXT_PUBLIC_FAKE_LOGIN_ENABLED=true). Nunca se activa en producción,
 * aunque la variable quede encendida por error.
 *
 * Hay un correo por rol para probar los permisos. La sesión usa el primer
 * usuario activo de ese rol en el tenant de prueba (sus acciones quedan en el
 * historial a su nombre); si no hay ninguno, el login de ese rol no entra.
 */
export const FAKE_LOGIN_ENABLED =
  process.env.NEXT_PUBLIC_FAKE_LOGIN_ENABLED === "true" &&
  process.env.NODE_ENV !== "production";

const PASSWORD_FAKE = "demo1234";

/** Correo de prueba → rol. */
const CUENTAS_FAKE = {
  "admin@demo.com": "admin",
  "vendedor@demo.com": "vendedor",
  "despacho@demo.com": "despacho",
} as const;

type RolFake = (typeof CUENTAS_FAKE)[keyof typeof CUENTAS_FAKE];

export const CREDENCIALES_FAKE = {
  emails: Object.keys(CUENTAS_FAKE),
  password: PASSWORD_FAKE,
};

export const COOKIE_FAKE = "fake_session";

/** Tenant 1 (en el seed se llama "Distribuidora Uno"; en la base de desarrollo, DIBSA). */
const TENANT_FAKE = { id: "1", slug: "distribuidora-uno", nombreEmpresa: "DIBSA" };

function esRolFake(valor: string | undefined): valor is RolFake {
  return Object.values(CUENTAS_FAKE).includes(valor as RolFake);
}

/** El rol de prueba que corresponde a esas credenciales, o null. */
export function rolDeCredencialesFake(email: string, password: string): RolFake | null {
  if (!FAKE_LOGIN_ENABLED || password !== PASSWORD_FAKE) return null;
  return CUENTAS_FAKE[email as keyof typeof CUENTAS_FAKE] ?? null;
}

export async function iniciarSesionFake(rol: RolFake) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_FAKE, rol, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function cerrarSesionFake() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_FAKE);
}

/** La sesión de prueba si el login fake está activo y el usuario entró con él. */
export async function getSesionFake(): Promise<Session | null> {
  if (!FAKE_LOGIN_ENABLED) return null;
  const cookieStore = await cookies();
  const valor = cookieStore.get(COOKIE_FAKE)?.value;
  if (valor === undefined) return null;
  // Cookies viejas ("1") eran del admin.
  const rol: RolFake = esRolFake(valor) ? valor : "admin";

  const { data: usuario } = await createAdminClient()
    .from("usuarios")
    .select("id, nombre")
    .eq("tenant_id", TENANT_FAKE.id)
    .eq("rol", rol)
    .eq("activo", true)
    .order("id")
    .limit(1)
    .maybeSingle();
  if (!usuario) return null;

  const email = Object.entries(CUENTAS_FAKE).find(([, r]) => r === rol)?.[0] ?? "";
  return {
    id: TENANT_FAKE.id,
    slug: TENANT_FAKE.slug,
    nombreEmpresa: TENANT_FAKE.nombreEmpresa,
    usuarioId: usuario.id,
    usuarioNombre: usuario.nombre,
    rol,
    email,
    negocios: [{ tenantId: TENANT_FAKE.id, nombreEmpresa: TENANT_FAKE.nombreEmpresa, rol }],
  };
}
