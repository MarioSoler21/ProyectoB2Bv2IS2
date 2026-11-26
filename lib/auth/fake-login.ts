import "server-only";

import { cookies } from "next/headers";

import type { Session } from "@/lib/session";

/**
 * Login de prueba con credenciales fijas, solo para desarrollo local
 * (NEXT_PUBLIC_FAKE_LOGIN_ENABLED=true). Nunca se activa en producción,
 * aunque la variable quede encendida por error.
 */
export const FAKE_LOGIN_ENABLED =
  process.env.NEXT_PUBLIC_FAKE_LOGIN_ENABLED === "true" &&
  process.env.NODE_ENV !== "production";

export const CREDENCIALES_FAKE = {
  email: "admin@demo.com",
  password: "demo1234",
} as const;

export const COOKIE_FAKE = "fake_session";

/** Tenant 1 de supabase/seed.sql ("Distribuidora Uno"). */
const SESION_FAKE: Session = {
  id: "1",
  slug: "distribuidora-uno",
  nombreEmpresa: "Distribuidora Uno",
  usuarioId: 1,
  usuarioNombre: "Admin Demo",
  rol: "admin",
  email: CREDENCIALES_FAKE.email,
  negocios: [{ tenantId: "1", nombreEmpresa: "Distribuidora Uno", rol: "admin" }],
};

export function sonCredencialesFake(email: string, password: string): boolean {
  return (
    FAKE_LOGIN_ENABLED &&
    email === CREDENCIALES_FAKE.email &&
    password === CREDENCIALES_FAKE.password
  );
}

export async function iniciarSesionFake() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_FAKE, "1", { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function cerrarSesionFake() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_FAKE);
}

/** La sesión de prueba si el login fake está activo y el usuario entró con él. */
export async function getSesionFake(): Promise<Session | null> {
  if (!FAKE_LOGIN_ENABLED) return null;
  const cookieStore = await cookies();
  return cookieStore.has(COOKIE_FAKE) ? SESION_FAKE : null;
}
