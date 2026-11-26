import "server-only";

import {
  diaSemana,
  esFechaSeleccionable,
  fechaCorta,
  formatearMomento,
  hoyISO,
  proximosDias,
  type DiaEntrega,
} from "@/lib/portal/fechas";
import type {
  ClientePortal,
  FechaISO,
  LineaPedido,
  PedidoVista,
  ProductoPortal,
  ResultadoEnvio,
} from "@/lib/portal/types";
import { envioCarritoSchema } from "@/lib/portal/validacion";

import { DEMO_TOKEN, demoPortalRepositorio } from "./demo-repositorio";
import type { PortalRepositorio } from "./repositorio";
import { supabasePortalRepositorio } from "./supabase-repositorio";

/**
 * Servicio del portal de cliente: arma lo que necesita la pantalla y valida
 * el envío del carrito. Las reglas viven acá; el acceso a datos, en el
 * repositorio que corresponda al token.
 */

export type PortalData = {
  cliente: ClientePortal;
  productos: ProductoPortal[];
  dias: DiaEntrega[];
  pedidos: PedidoVista[];
  /** Pedido sugerido para cada día seleccionable. */
  sugerencias: Record<FechaISO, LineaPedido[]>;
};

function demoHabilitada(): boolean {
  return process.env.PORTAL_DEMO_ENABLED === "true";
}

function repositorioPara(token: string): PortalRepositorio {
  return demoHabilitada() && token === DEMO_TOKEN
    ? demoPortalRepositorio
    : supabasePortalRepositorio;
}

function indexarPorId(productos: ProductoPortal[]): Map<number, ProductoPortal> {
  return new Map(productos.map((p) => [p.id, p]));
}

/** Plantilla del día de la semana o, si no hay, el último pedido. Solo productos aún activos. */
function sugerenciaPara(
  fecha: FechaISO,
  plantillas: Map<number, LineaPedido[]>,
  ultimoPedido: LineaPedido[],
  catalogoPorId: ReadonlyMap<number, ProductoPortal>,
): LineaPedido[] {
  const base = plantillas.get(diaSemana(fecha)) ?? ultimoPedido;
  return base.filter((l) => catalogoPorId.has(l.productoId));
}

export async function getPortalData(token: string): Promise<PortalData | null> {
  const repo = repositorioPara(token);
  const cliente = await repo.clientePorToken(token);
  if (!cliente) return null;

  const hoy = hoyISO();
  const dias = proximosDias(hoy);
  const ultimoDia = dias[dias.length - 1].fecha;

  const [productos, pedidos, plantillas, ultimoPedido] = await Promise.all([
    repo.catalogo(cliente),
    repo.pedidosEntre(cliente, hoy, ultimoDia),
    repo.plantillasPorDiaSemana(cliente),
    repo.lineasUltimoPedido(cliente),
  ]);

  const catalogoPorId = indexarPorId(productos);

  return {
    cliente,
    productos,
    dias,
    pedidos: pedidos.map((p) => ({
      ...p,
      creadoEtiqueta: formatearMomento(p.creadoAt, hoy),
      entregaEtiqueta: fechaCorta(p.fechaEntrega),
    })),
    sugerencias: Object.fromEntries(
      dias.map((d) => [
        d.fecha,
        sugerenciaPara(d.fecha, plantillas, ultimoPedido, catalogoPorId),
      ]),
    ),
  };
}

export async function getClientePorToken(token: string): Promise<ClientePortal | null> {
  return repositorioPara(token).clientePorToken(token);
}

/**
 * Valida y registra el carrito. `payload` viene del navegador: se valida
 * con zod y se contrasta contra el catálogo y las fechas permitidas.
 */
export async function enviarPedidos(
  token: string,
  payload: unknown,
): Promise<ResultadoEnvio> {
  const envio = envioCarritoSchema.safeParse(payload);
  if (!envio.success) {
    return { ok: false, error: envio.error.issues[0]?.message ?? "Pedido inválido." };
  }

  const repo = repositorioPara(token);
  const cliente = await repo.clientePorToken(token);
  if (!cliente) {
    return { ok: false, error: "El enlace no es válido o el cliente está inactivo." };
  }

  const hoy = hoyISO();
  if (envio.data.some((p) => !esFechaSeleccionable(p.fechaEntrega, hoy))) {
    return {
      ok: false,
      error: "Alguna fecha de entrega ya no está disponible. Revisa el carrito.",
    };
  }

  const catalogoPorId = indexarPorId(await repo.catalogo(cliente));
  const productoInexistente = envio.data.some((p) =>
    p.lineas.some((l) => !catalogoPorId.has(l.productoId)),
  );
  if (productoInexistente) {
    return { ok: false, error: "Algún producto ya no está disponible. Revisa el carrito." };
  }

  const numeros = await repo.crearPedidos(cliente, envio.data, catalogoPorId);
  return { ok: true, numeros };
}
