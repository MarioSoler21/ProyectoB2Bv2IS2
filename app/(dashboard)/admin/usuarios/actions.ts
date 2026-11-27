"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, parseId, pgErrorState } from "@/lib/admin-action-utils";
import {
  parseForm,
  ROLES_CON_CORREO,
  usuarioSchema,
  type FormState,
} from "@/lib/validation/admin";

/**
 * Usuarios del tenant. Quien entra con correo tiene una cuenta en Supabase Auth
 * (la crea el admin con una contraseña inicial; no hay registro público) y su
 * fila en `usuarios` apunta a ella con auth_user_id. El operador de bodega
 * entra con PIN, que se guarda hasheado en la base (fijar_pin_usuario).
 */

const RUTA = "/admin/usuarios";

function errorDeCampo(campo: string, mensaje: string): FormState {
  return { ok: false, error: "Revisá los campos marcados.", fieldErrors: { [campo]: [mensaje] } };
}

/** Traduce los errores de la Admin API de Auth a algo que el admin entienda. */
function errorDeAcceso(error: { code?: string; message?: string }): FormState {
  if (error.code === "email_exists" || /already been registered/i.test(error.message ?? "")) {
    return errorDeCampo("email", "Ese correo ya tiene una cuenta. Usa otro.");
  }
  if (error.code === "weak_password") {
    return errorDeCampo("password", "La contraseña es muy débil. Usa una más larga o con números.");
  }
  return { ok: false, error: error.message ?? "No pudimos crear el acceso." };
}

async function crearAcceso(
  email: string,
  password: string,
): Promise<{ ok: true; id: string } | { ok: false; error: FormState }> {
  const { data, error } = await createAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return { ok: false, error: errorDeAcceso(error) };
  return { ok: true, id: data.user.id };
}

async function fijarPin(tenantId: string, usuarioId: number, pin: string) {
  const { error } = await createAdminClient().rpc("fijar_pin_usuario", {
    p_tenant_id: Number(tenantId),
    p_usuario_id: usuarioId,
    p_pin: pin,
  });
  return error ? pgErrorState(error) : null;
}

/**
 * Que la empresa nunca se quede sin un admin activo, y que nadie se quite a sí
 * mismo el acceso de admin por error.
 */
async function protegerAdmins(
  tenantId: string,
  sesionUsuarioId: number,
  usuario: { id: number; rol: string; activo: boolean },
  cambio: { rol: string; activo: boolean },
): Promise<FormState | null> {
  const dejaDeSerAdmin = usuario.rol === "admin" && usuario.activo && (cambio.rol !== "admin" || !cambio.activo);
  if (!dejaDeSerAdmin) return null;

  if (usuario.id === sesionUsuarioId) {
    return { ok: false, error: "No puedes quitarte el rol de admin ni desactivarte a ti mismo." };
  }
  const { count, error } = await createAdminClient()
    .from("usuarios")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("rol", "admin")
    .eq("activo", true)
    .neq("id", usuario.id);
  if (error) return pgErrorState(error);
  if (!count) return { ok: false, error: "Tiene que quedar al menos un administrador activo." };
  return null;
}

export async function crearUsuario(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tenant = await requireAdmin();
  const parsed = parseForm(usuarioSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { email, password, pin, ...datos } = parsed.data;

  if (ROLES_CON_CORREO.includes(datos.rol) && !email) {
    return errorDeCampo("email", "Este rol entra con correo: escríbelo.");
  }
  if (email && !password) {
    return errorDeCampo("password", "Ponle una contraseña inicial para que pueda entrar.");
  }

  let authUserId: string | null = null;
  if (email && password) {
    const acceso = await crearAcceso(email, password);
    if (!acceso.ok) return acceso.error;
    authUserId = acceso.id;
  }

  const supabase = createAdminClient();
  const { data: creado, error } = await supabase
    .from("usuarios")
    .insert({ ...datos, email, auth_user_id: authUserId, tenant_id: tenant.id })
    .select("id")
    .single();
  if (error) {
    // No dejar una cuenta de Auth huérfana que no apunta a ningún usuario.
    if (authUserId) await supabase.auth.admin.deleteUser(authUserId);
    return pgErrorState(error);
  }

  if (pin) {
    const errorPin = await fijarPin(tenant.id, creado.id, pin);
    if (errorPin) return errorPin;
  }

  revalidatePath(RUTA);
  return { ok: true };
}

export async function actualizarUsuario(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tenant = await requireAdmin();
  const id = parseId(formData);
  if (!id) return { ok: false, error: "ID inválido." };
  const parsed = parseForm(usuarioSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { email, password, pin, ...datos } = parsed.data;

  const supabase = createAdminClient();
  const { data: actual, error: errorActual } = await supabase
    .from("usuarios")
    .select("id, rol, activo, email, auth_user_id")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (errorActual) return pgErrorState(errorActual);
  if (!actual) return { ok: false, error: "Ese usuario ya no existe." };

  const bloqueo = await protegerAdmins(tenant.id, tenant.usuarioId, actual, datos);
  if (bloqueo) return bloqueo;

  let authUserId: string | null = actual.auth_user_id;
  if (authUserId) {
    if (!email) return errorDeCampo("email", "Este usuario entra con correo: no lo dejes vacío.");
    const cambios = {
      ...(email !== actual.email ? { email, email_confirm: true } : {}),
      ...(password ? { password } : {}),
    };
    if (Object.keys(cambios).length > 0) {
      const { error } = await supabase.auth.admin.updateUserById(authUserId, cambios);
      if (error) return errorDeAcceso(error);
    }
  } else if (email) {
    // Usuario sin acceso todavía: se le crea ahora.
    if (!password) return errorDeCampo("password", "Ponle una contraseña inicial para que pueda entrar.");
    const acceso = await crearAcceso(email, password);
    if (!acceso.ok) return acceso.error;
    authUserId = acceso.id;
  } else if (ROLES_CON_CORREO.includes(datos.rol)) {
    return errorDeCampo("email", "Este rol entra con correo: escríbelo.");
  }

  const { error } = await supabase
    .from("usuarios")
    .update({ ...datos, email: email ?? actual.email, auth_user_id: authUserId })
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  if (error) return pgErrorState(error);

  if (pin) {
    const errorPin = await fijarPin(tenant.id, id, pin);
    if (errorPin) return errorPin;
  }

  revalidatePath(RUTA);
  return { ok: true };
}

export async function setActivoUsuario(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tenant = await requireAdmin();
  const id = parseId(formData);
  if (!id) return { ok: false, error: "ID inválido." };
  const activo = formData.get("activo") === "true";

  const supabase = createAdminClient();
  const { data: actual, error: errorActual } = await supabase
    .from("usuarios")
    .select("id, rol, activo")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (errorActual) return pgErrorState(errorActual);
  if (!actual) return { ok: false, error: "Ese usuario ya no existe." };

  const bloqueo = await protegerAdmins(tenant.id, tenant.usuarioId, actual, { rol: actual.rol, activo });
  if (bloqueo) return bloqueo;

  const { error } = await supabase
    .from("usuarios")
    .update({ activo })
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  if (error) return pgErrorState(error);

  revalidatePath(RUTA);
  return { ok: true };
}
