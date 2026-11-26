import "server-only";

import {
  aProductoPedido,
  COLUMNAS_PRODUCTO,
  getCatalogoPedido,
  type FilaProducto,
} from "@/lib/data/catalogo-pedido";
import type { EstadoPedido } from "@/lib/data/pedidos";
import { SIN_RUTA } from "@/lib/despacho/filtros";
import type { EdicionPedido } from "@/lib/despacho/validacion";
import type {
  EstadoPrevio,
  OpcionFiltro,
  OrigenPedido,
  PedidoDespacho,
  TableroDespacho,
} from "@/lib/despacho/types";
import { etiquetaDia, formatearMomento, hoyISO, sumarDias } from "@/lib/portal/fechas";
import type { LineaPedido, ProductoPortal } from "@/lib/portal/types";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Datos del panel de despacho. Usa service_role, así que TODA consulta filtra
 * explícitamente por tenant_id (sale de la sesión, nunca del navegador).
 */

/** Días de historial que se muestran; los pendientes vencidos se traen siempre. */
const DIAS_HISTORIAL = 14;
/** Tope de seguridad para no mandar miles de tarjetas al navegador. */
const MAX_PEDIDOS = 600;

const ESTADOS_PENDIENTES = ["pendiente", "confirmado", "en_preparacion"] as const;
const ESTADOS_CERRADOS = ["despachado", "entregado", "anulado"] as const;

/** Error con un mensaje apto para mostrarle al usuario tal cual. */
export class ErrorDespacho extends Error {}

type FilaZona = { id: number; nombre: string } | null;

type FilaPedido = {
  id: number;
  numero_pedido: number;
  estado: EstadoPedido;
  origen: OrigenPedido;
  fecha_pedido: string;
  fecha_entrega: string | null;
  created_at: string;
  total: number | string;
  notas: string | null;
  zona: FilaZona;
  cliente: {
    id: number;
    nombre_negocio: string;
    nombre_contacto: string | null;
    zona: FilaZona;
  } | null;
  items: { producto_id: number; cantidad: number | string; producto: FilaProducto | null }[];
};

/** Suma las cantidades si un producto aparece en más de una fila del pedido. */
function unificarLineas(items: FilaPedido["items"]): LineaPedido[] {
  const porProducto = new Map<number, number>();
  for (const item of items) {
    porProducto.set(item.producto_id, (porProducto.get(item.producto_id) ?? 0) + Number(item.cantidad));
  }
  return [...porProducto].map(([productoId, cantidad]) => ({ productoId, cantidad }));
}

function aPedidoDespacho(fila: FilaPedido, hoy: string): PedidoDespacho {
  return {
    id: fila.id,
    numero: fila.numero_pedido,
    estado: fila.estado,
    origen: fila.origen,
    fechaEntrega: fila.fecha_entrega ?? hoyISO(new Date(fila.fecha_pedido)),
    creadoEtiqueta: formatearMomento(fila.created_at, hoy),
    cliente: {
      id: fila.cliente?.id ?? 0,
      nombre: fila.cliente?.nombre_negocio ?? "Cliente eliminado",
      contacto: fila.cliente?.nombre_contacto ?? null,
    },
    // La ruta del pedido manda; si no tiene, la del cliente.
    ruta: fila.zona ?? fila.cliente?.zona ?? null,
    lineas: unificarLineas(fila.items),
    notas: fila.notas,
    total: Number(fila.total),
  };
}

function opcionesUnicas(opciones: (OpcionFiltro | null)[]): OpcionFiltro[] {
  const porId = new Map<number, OpcionFiltro>();
  for (const opcion of opciones) if (opcion) porId.set(opcion.id, opcion);
  return [...porId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function getTableroDespacho(tenantId: string): Promise<TableroDespacho> {
  const hoy = hoyISO();
  const desde = sumarDias(hoy, -DIAS_HISTORIAL);

  const [{ data, error }, catalogo] = await Promise.all([
    createAdminClient()
      .from("pedidos")
      .select(
        `id, numero_pedido, estado, origen, fecha_pedido, fecha_entrega, created_at, total, notas,
         zona:zonas ( id, nombre ),
         cliente:clientes ( id, nombre_negocio, nombre_contacto, zona:zonas ( id, nombre ) ),
         items:pedido_items ( producto_id, cantidad, producto:productos ( ${COLUMNAS_PRODUCTO} ) )`,
      )
      .eq("tenant_id", tenantId)
      .neq("estado", "anulado")
      .or(
        [
          `fecha_entrega.gte.${desde}`,
          `estado.in.(${ESTADOS_PENDIENTES.join(",")})`,
          `and(fecha_entrega.is.null,fecha_pedido.gte.${desde})`,
        ].join(","),
      )
      .order("fecha_entrega", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(MAX_PEDIDOS),
    getCatalogoPedido(tenantId),
  ]);

  if (error) throw error;
  const filas = data as unknown as FilaPedido[];
  const pedidos = filas.map((fila) => aPedidoDespacho(fila, hoy));

  const enCatalogo = new Set(catalogo.map((p) => p.id));
  const retirados = new Map<number, ProductoPortal>();
  for (const item of filas.flatMap((f) => f.items)) {
    if (item.producto && !enCatalogo.has(item.producto.id)) {
      retirados.set(item.producto.id, aProductoPedido(item.producto));
    }
  }

  const fechas = new Set(pedidos.map((p) => p.fechaEntrega));
  return {
    hoy,
    pedidos,
    etiquetasDia: Object.fromEntries([...fechas].map((f) => [f, etiquetaDia(f, hoy)])),
    clientes: opcionesUnicas(pedidos.map((p) => ({ id: p.cliente.id, nombre: p.cliente.nombre }))),
    rutas: [
      ...opcionesUnicas(pedidos.map((p) => p.ruta)),
      ...(pedidos.some((p) => !p.ruta) ? [{ id: SIN_RUTA, nombre: "Sin ruta" }] : []),
    ],
    catalogo,
    productosRetirados: [...retirados.values()],
  };
}

type Autor = { tenantId: string; usuarioId: number };

type CambioHistorial = {
  pedidoId: number;
  anterior: EstadoPedido | null;
  nuevo: EstadoPedido;
  comentario: string;
};

async function registrarHistorial(autor: Autor, cambios: CambioHistorial[]) {
  if (cambios.length === 0) return;
  const { error } = await createAdminClient()
    .from("pedido_historial")
    .insert(
      cambios.map((c) => ({
        tenant_id: autor.tenantId,
        pedido_id: c.pedidoId,
        estado_anterior: c.anterior,
        estado_nuevo: c.nuevo,
        empleado_id: autor.usuarioId,
        comentario: c.comentario,
      })),
    );
  if (error) throw error;
}

/** Marca como despachados los pedidos que sigan pendientes. Devuelve su estado anterior. */
export async function despacharPedidos(autor: Autor, ids: number[]): Promise<EstadoPrevio[]> {
  const supabase = createAdminClient();
  const { data: pendientes, error } = await supabase
    .from("pedidos")
    .select("id, estado")
    .eq("tenant_id", autor.tenantId)
    .in("id", ids)
    .in("estado", ESTADOS_PENDIENTES);
  if (error) throw error;
  if (pendientes.length === 0) return [];

  const { error: errorUpdate } = await supabase
    .from("pedidos")
    .update({
      estado: "despachado",
      despachado_at: new Date().toISOString(),
      despachado_por: autor.usuarioId,
    })
    .eq("tenant_id", autor.tenantId)
    .in("id", pendientes.map((p) => p.id))
    .in("estado", ESTADOS_PENDIENTES);
  if (errorUpdate) throw errorUpdate;

  const previos = pendientes as EstadoPrevio[];
  await registrarHistorial(
    autor,
    previos.map((p) => ({ pedidoId: p.id, anterior: p.estado, nuevo: "despachado", comentario: "Despachado desde el tablero" })),
  );
  return previos;
}

/** Deshace un despacho: cada pedido vuelve al estado que tenía. */
export async function restaurarEstados(autor: Autor, previos: EstadoPrevio[]): Promise<void> {
  const supabase = createAdminClient();
  const porEstado = Map.groupBy(previos, (p) => p.estado);

  for (const [estado, grupo] of porEstado) {
    const { error } = await supabase
      .from("pedidos")
      .update({ estado, despachado_at: null, despachado_por: null })
      .eq("tenant_id", autor.tenantId)
      .in("id", grupo.map((p) => p.id))
      .eq("estado", "despachado");
    if (error) throw error;
  }

  await registrarHistorial(
    autor,
    previos.map((p) => ({ pedidoId: p.id, anterior: "despachado", nuevo: p.estado, comentario: "Despacho deshecho" })),
  );
}

async function pedidoEditable(autor: Autor, id: number) {
  const { data, error } = await createAdminClient()
    .from("pedidos")
    .select("id, estado, descuento")
    .eq("tenant_id", autor.tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ErrorDespacho("El pedido ya no existe.");
  if ((ESTADOS_CERRADOS as readonly string[]).includes(data.estado)) {
    throw new ErrorDespacho("Este pedido ya salió o fue anulado; no se puede editar.");
  }
  return { estado: data.estado as EstadoPedido, descuento: Number(data.descuento) };
}

/**
 * Reemplaza las líneas y notas de un pedido. Los precios salen del catálogo;
 * un producto que ya no está activo conserva el precio con que se pidió.
 * Inserta las líneas nuevas ANTES de borrar las viejas: si algo falla a
 * mitad, el pedido nunca queda vacío.
 */
export async function guardarEdicion(autor: Autor, edicion: EdicionPedido): Promise<void> {
  const supabase = createAdminClient();
  const { descuento } = await pedidoEditable(autor, edicion.id);
  const productoIds = edicion.lineas.map((l) => l.productoId);

  const [viejas, catalogo] = await Promise.all([
    supabase
      .from("pedido_items")
      .select("id, producto_id, precio_unitario")
      .eq("tenant_id", autor.tenantId)
      .eq("pedido_id", edicion.id),
    supabase
      .from("productos")
      .select("id, precio")
      .eq("tenant_id", autor.tenantId)
      .eq("activo", true)
      .in("id", productoIds),
  ]);
  if (viejas.error) throw viejas.error;
  if (catalogo.error) throw catalogo.error;

  const precios = new Map<number, number>();
  for (const item of viejas.data) precios.set(item.producto_id, Number(item.precio_unitario));
  for (const producto of catalogo.data) precios.set(producto.id, Number(producto.precio));

  const items = edicion.lineas.map((linea) => {
    const precio = precios.get(linea.productoId);
    if (precio === undefined) throw new ErrorDespacho("Uno de los productos ya no está disponible.");
    return {
      tenant_id: autor.tenantId,
      pedido_id: edicion.id,
      producto_id: linea.productoId,
      cantidad: linea.cantidad,
      precio_unitario: precio,
      subtotal: precio * linea.cantidad,
    };
  });
  const subtotal = items.reduce((suma, item) => suma + item.subtotal, 0);

  const { error: errorInsert } = await supabase.from("pedido_items").insert(items);
  if (errorInsert) throw errorInsert;

  if (viejas.data.length > 0) {
    const { error: errorDelete } = await supabase
      .from("pedido_items")
      .delete()
      .eq("tenant_id", autor.tenantId)
      .in("id", viejas.data.map((i) => i.id));
    if (errorDelete) throw errorDelete;
  }

  const { error: errorUpdate } = await supabase
    .from("pedidos")
    .update({ subtotal, total: Math.max(0, subtotal - descuento), notas: edicion.notas || null })
    .eq("tenant_id", autor.tenantId)
    .eq("id", edicion.id);
  if (errorUpdate) throw errorUpdate;
}

/** Anula (no borra) un pedido que todavía no salió; queda en el historial. */
export async function anularPedido(autor: Autor, id: number): Promise<void> {
  const { estado } = await pedidoEditable(autor, id);
  const { error } = await createAdminClient()
    .from("pedidos")
    .update({ estado: "anulado" })
    .eq("tenant_id", autor.tenantId)
    .eq("id", id);
  if (error) throw error;

  await registrarHistorial(autor, [
    { pedidoId: id, anterior: estado, nuevo: "anulado", comentario: "Anulado desde el tablero" },
  ]);
}
