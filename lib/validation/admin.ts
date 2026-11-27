import { z } from "zod";

import { ROLES } from "@/lib/auth/permisos";

/**
 * Esquemas de validación para las server actions de /admin. Reciben el objeto
 * plano de un FormData (Object.fromEntries), así que todo entra como string.
 */

const requerido = z.string().trim().min(1, "Requerido");
const textoOpcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v));
const booleano = z
  .enum(["true", "false"])
  .transform((v) => v === "true");
const idOpcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isInteger(v) && v > 0), "Inválido");
const montoNoNegativo = z.coerce
  .number()
  .refine((v) => Number.isFinite(v) && v >= 0, "No puede ser negativo");
const hexOpcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v.toLowerCase()))
  .refine((v) => v === null || /^#[0-9a-f]{6}$/.test(v), "Color inválido (#rrggbb)");

export { ROLES };

/** Roles que entran al panel con correo y contraseña (el operador de bodega usa PIN). */
export const ROLES_CON_CORREO: readonly string[] = ["admin", "vendedor", "despacho"];

const correoOpcional = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || z.email().safeParse(v).success, "Correo inválido");

/** Contraseña nueva: vacía significa "no tocar". */
const contrasenaOpcional = z
  .string()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || v.length >= 8, "Mínimo 8 caracteres");

/** PIN nuevo: vacío significa "no tocar". Se guarda hasheado. */
const pinOpcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /^\d{4,6}$/.test(v), "De 4 a 6 dígitos");

export const UNIDADES = [
  "unidad",
  "caja",
  "saco",
  "libra",
  "kg",
  "litro",
  "docena",
] as const;


export const TIPOS_CLIENTE = [
  "pulperia",
  "minimarket",
  "mayorista",
  "contratista",
  "reventa",
  "otro",
] as const;

export const usuarioSchema = z.object({
  nombre: requerido,
  rol: z.enum(ROLES),
  telefono: textoOpcional,
  email: correoOpcional,
  password: contrasenaOpcional,
  pin: pinOpcional,
  activo: booleano,
});

export const clienteSchema = z.object({
  nombre_negocio: requerido,
  nombre_contacto: textoOpcional,
  telefono: textoOpcional,
  direccion: textoOpcional,
  zona_id: idOpcional,
  vendedor_id: idOpcional,
  tipo_cliente: textoOpcional,
  notas: textoOpcional,
  activo: booleano,
});

export const productoSchema = z.object({
  sku: requerido,
  nombre: requerido,
  categoria_id: idOpcional,
  unidad_medida: z.enum(UNIDADES),
  precio: montoNoNegativo,
  costo: montoNoNegativo,
  stock_minimo: montoNoNegativo,
  activo: booleano,
});

export const zonaSchema = z.object({
  nombre: requerido,
  descripcion: textoOpcional,
  orden: z.coerce.number().int().refine((v) => Number.isFinite(v), "Inválido"),
  activa: booleano,
});

export const categoriaSchema = z.object({
  nombre: requerido,
});

/**
 * Lo que el admin de una empresa puede cambiar de su cuenta. El plan y el
 * identificador (slug) los define Pedidly: no están acá a propósito, así que
 * aunque alguien los mande en el formulario, no se guardan.
 */
export const tenantConfigSchema = z.object({
  nombre_empresa: requerido,
  nombre_app: textoOpcional,
  subtitulo_app: textoOpcional,
  mensaje_portal: textoOpcional,
  color_primario: hexOpcional,
  color_secundario: hexOpcional,
  color_sidebar: hexOpcional,
});

export type FormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/** Corre un schema sobre un FormData y devuelve datos tipados o un FormState de error. */
export function parseForm<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): { ok: true; data: z.infer<T> } | { ok: false; state: FormState } {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (parsed.success) return { ok: true, data: parsed.data };
  const flat = z.flattenError(parsed.error);
  return {
    ok: false,
    state: {
      ok: false,
      error: "Revisá los campos marcados.",
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
    },
  };
}

/** Entrada de mercadería (suma) o ajuste por conteo físico (el stock pasa a ser ese número). */
export const movimientoStockSchema = z.object({
  producto_id: z.coerce.number().int().positive(),
  tipo: z.enum(["entrada", "ajuste"]),
  cantidad: z.coerce
    .number()
    .refine((v) => Number.isFinite(v) && v >= 0, "Tiene que ser un número mayor o igual a cero")
    .refine((v) => v <= 1_000_000, "Demasiado grande"),
  motivo: textoOpcional,
});
