import { formatearCantidad, formatearMoneda } from "@/lib/portal/formato";
import type { FechaISO, ProductoPortal } from "@/lib/portal/types";

import type { PedidoDespacho } from "./types";

/**
 * Lista de despacho en PDF: por cada ruta, sus pedidos y la carga
 * consolidada (cuánto de cada producto subir al camión). Corre en el
 * navegador; jsPDF se carga recién al generar para no pesar en el bundle.
 */

type Datos = {
  pedidos: PedidoDespacho[];
  productosPorId: ReadonlyMap<number, ProductoPortal>;
  etiquetasDia: Record<FechaISO, string>;
  empresa: string;
};

const SIN_RUTA = "Sin ruta";
const COLOR_ENCABEZADO: [number, number, number] = [30, 41, 59];

function agruparPorRuta(pedidos: PedidoDespacho[]): [string, PedidoDespacho[]][] {
  const grupos = Map.groupBy(pedidos, (p) => p.ruta?.nombre ?? SIN_RUTA);
  return [...grupos].sort(([a], [b]) =>
    a === SIN_RUTA ? 1 : b === SIN_RUTA ? -1 : a.localeCompare(b),
  );
}

function cargaConsolidada(
  pedidos: PedidoDespacho[],
  productosPorId: ReadonlyMap<number, ProductoPortal>,
): string[][] {
  const totales = new Map<number, number>();
  for (const linea of pedidos.flatMap((p) => p.lineas)) {
    totales.set(linea.productoId, (totales.get(linea.productoId) ?? 0) + linea.cantidad);
  }
  return [...totales]
    .map(([id, cantidad]) => ({ producto: productosPorId.get(id), cantidad }))
    .sort((a, b) => (a.producto?.nombre ?? "").localeCompare(b.producto?.nombre ?? ""))
    .map(({ producto, cantidad }) => [
      producto?.sku ?? "—",
      producto?.nombre ?? "Producto eliminado",
      formatearCantidad(cantidad),
      producto?.unidad ?? "",
    ]);
}

export async function descargarListaDespacho({ pedidos, productosPorId, etiquetasDia, empresa }: Datos) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Lista de despacho — ${empresa}`, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(
    `${pedidos.length} pedidos · generado el ${new Intl.DateTimeFormat("es-HN", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date())}`,
    14,
    24,
  );
  doc.setTextColor(0);

  // lastAutoTable lo agrega jspdf-autotable al documento.
  const finDeTabla = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  let y = 32;

  for (const [ruta, delaRuta] of agruparPorRuta(pedidos)) {
    if (y > 250) {
      doc.addPage();
      y = 18;
    }
    doc.setFontSize(13);
    doc.text(`${ruta} · ${delaRuta.length} pedidos`, 14, y);

    autoTable(doc, {
      startY: y + 3,
      head: [["#", "Cliente", "Entrega", "Prod.", "Total"]],
      body: delaRuta.map((p) => [
        p.numero,
        p.cliente.nombre,
        etiquetasDia[p.fechaEntrega] ?? p.fechaEntrega,
        p.lineas.length,
        formatearMoneda(p.total),
      ]),
      headStyles: { fillColor: COLOR_ENCABEZADO },
      styles: { fontSize: 9 },
    });

    autoTable(doc, {
      startY: finDeTabla() + 4,
      head: [["Código", "Carga de la ruta", "Cantidad", "Unidad"]],
      body: cargaConsolidada(delaRuta, productosPorId),
      headStyles: { fillColor: [71, 85, 105] },
      styles: { fontSize: 9 },
      columnStyles: { 2: { halign: "right" } },
    });

    y = finDeTabla() + 12;
  }

  doc.save(`despacho-${new Date().toISOString().slice(0, 10)}.pdf`);
}
