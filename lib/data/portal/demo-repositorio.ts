import "server-only";

import { toBranding } from "@/lib/branding";
import { hoyISO, sumarDias } from "@/lib/portal/fechas";
import type {
  ClientePortal,
  LineaPedido,
  LineaPedidoEnviado,
  PedidoEnviado,
  ProductoPortal,
} from "@/lib/portal/types";

import type { PortalRepositorio } from "./repositorio";

/**
 * Fuente de datos en memoria para ver el portal en local sin base de datos.
 * Solo se usa con PORTAL_DEMO_ENABLED=true y el token DEMO_TOKEN (ver
 * ./index.ts). Los pedidos enviados viven mientras corra el servidor.
 */

export const DEMO_TOKEN = "demo";

const CLIENTE_DEMO: ClientePortal = {
  id: 1,
  nombreNegocio: "Comercial La Esperanza",
  tenantId: 1,
  tenantNombre: "Distribuidora Demo",
  branding: toBranding({
    nombre_empresa: "Distribuidora Demo",
    nombre_app: "Pedidos",
    subtitulo_app: "Portal de clientes",
  }),
};

const CATALOGO_DEMO: ProductoPortal[] = [
  ["1001", "Chuleta de cerdo", "libra", "Cerdo", 62],
  ["1002", "Costilla de cerdo", "libra", "Cerdo", 58],
  ["1003", "Lomo de cerdo", "libra", "Cerdo", 75],
  ["1004", "Chicharrón", "libra", "Cerdo", 70],
  ["1005", "Pierna de cerdo", "libra", "Cerdo", 55],
  ["1010", "Pollo entero", "unidad", "Pollo", 160],
  ["1011", "Pechuga de pollo", "libra", "Pollo", 48],
  ["1012", "Alitas de pollo", "libra", "Pollo", 42],
  ["1013", "Muslo de pollo", "libra", "Pollo", 38],
  ["1014", "Pollo en piezas", "caja", "Pollo", 1450],
  ["1020", "Carne molida", "libra", "Res", 68],
  ["1021", "Bistec de res", "libra", "Res", 85],
  ["1022", "Costilla de res", "libra", "Res", 72],
  ["1023", "Posta de res", "libra", "Res", 80],
  ["1030", "Chorizo longaniza", "libra", "Embutidos", 65],
  ["1031", "Chorizo parrillero", "libra", "Embutidos", 70],
  ["1032", "Chorizo criollo", "unidad", "Embutidos", 18],
  ["1033", "Salchicha de pavo", "caja", "Embutidos", 520],
  ["1034", "Jamón de pavo", "libra", "Embutidos", 90],
  ["1035", "Mortadela", "libra", "Embutidos", 45],
  ["1040", "Queso seco", "libra", "Lácteos", 75],
  ["1041", "Mantequilla crema", "unidad", "Lácteos", 35],
  ["1042", "Quesillo", "libra", "Lácteos", 80],
  ["1050", "Huevos", "cesta", "Abarrotes", 110],
  ["1051", "Arroz", "saco", "Abarrotes", 950],
  ["1052", "Frijol rojo", "saco", "Abarrotes", 1300],
].map(([sku, nombre, unidad, categoria, precio], i) => ({
  id: i + 1,
  sku: String(sku),
  nombre: String(nombre),
  unidad: String(unidad),
  categoria: String(categoria),
  precio: Number(precio),
  stock: i % 9 === 8 ? 0 : 100,
}));

const productoPorSku = (sku: string) => CATALOGO_DEMO.find((p) => p.sku === sku)!;

const linea = (sku: string, cantidad: number): LineaPedido => ({
  productoId: productoPorSku(sku).id,
  cantidad,
});

/** Plantillas de pedido recurrente: lunes y jueves (0 = domingo). */
const PLANTILLAS_DEMO = new Map<number, LineaPedido[]>([
  [1, [linea("1001", 10), linea("1011", 15), linea("1030", 5), linea("1050", 2)]],
  [
    4,
    [
      linea("1002", 8),
      linea("1010", 6),
      linea("1012", 10),
      linea("1020", 12),
      linea("1031", 4),
      linea("1040", 3),
    ],
  ],
]);

type AlmacenDemo = { pedidos: PedidoEnviado[]; siguienteNumero: number };

function aLineaEnviada(producto: ProductoPortal, cantidad: number): LineaPedidoEnviado {
  const { sku, nombre, unidad, categoria } = producto;
  return { sku, nombre, unidad, categoria, cantidad };
}

function pedidoInicial(): PedidoEnviado {
  return {
    id: 1,
    numero: 2083,
    fechaEntrega: sumarDias(hoyISO(), 1),
    estado: "confirmado",
    creadoAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    notas: "Entregar antes de las 9 a. m.",
    lineas: [
      aLineaEnviada(productoPorSku("1001"), 5),
      aLineaEnviada(productoPorSku("1011"), 8),
      aLineaEnviada(productoPorSku("1030"), 2),
      aLineaEnviada(productoPorSku("1040"), 1),
    ],
  };
}

// En globalThis para sobrevivir al hot reload de `next dev`.
const globalDemo = globalThis as typeof globalThis & { __portalDemo?: AlmacenDemo };
function almacen(): AlmacenDemo {
  globalDemo.__portalDemo ??= { pedidos: [pedidoInicial()], siguienteNumero: 2084 };
  return globalDemo.__portalDemo;
}

export const demoPortalRepositorio: PortalRepositorio = {
  async clientePorToken(token) {
    return token === DEMO_TOKEN ? CLIENTE_DEMO : null;
  },

  async catalogo() {
    return CATALOGO_DEMO;
  },

  async pedidosEntre(_cliente, desde, hasta) {
    return almacen().pedidos.filter(
      (p) => p.fechaEntrega >= desde && p.fechaEntrega <= hasta,
    );
  },

  async plantillasPorDiaSemana() {
    return PLANTILLAS_DEMO;
  },

  async lineasUltimoPedido() {
    const ultimo = almacen().pedidos.at(-1);
    if (!ultimo) return [];
    return ultimo.lineas.map((l) => linea(l.sku, l.cantidad));
  },

  async crearPedidos(_cliente, pedidos, catalogoPorId) {
    const store = almacen();
    return pedidos.map((pedido) => {
      const numero = store.siguienteNumero++;
      store.pedidos.push({
        id: numero,
        numero,
        fechaEntrega: pedido.fechaEntrega,
        estado: "pendiente",
        creadoAt: new Date().toISOString(),
        notas: pedido.notas || null,
        lineas: pedido.lineas.map(({ productoId, cantidad }) =>
          aLineaEnviada(catalogoPorId.get(productoId)!, cantidad),
        ),
      });
      return numero;
    });
  },
};
