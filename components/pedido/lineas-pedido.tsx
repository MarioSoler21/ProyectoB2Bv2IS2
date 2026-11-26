"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { agruparPorCategoria } from "@/lib/portal/borrador";
import type { LineaPedido, ProductoPortal } from "@/lib/portal/types";

import { EncabezadoCategoria } from "./encabezado-categoria";
import { SelectorCantidad } from "./selector-cantidad";

type Props = {
  lineas: LineaPedido[];
  productosPorId: ReadonlyMap<number, ProductoPortal>;
  onCambiarCantidad: (productoId: number, cantidad: number) => void;
  onQuitar: (productoId: number) => void;
};

/** "Tu pedido": líneas editables agrupadas por categoría. */
export function LineasPedido({ lineas, productosPorId, onCambiarCantidad, onQuitar }: Props) {
  const conProducto = lineas.flatMap((linea) => {
    const producto = productosPorId.get(linea.productoId);
    return producto ? [{ linea, producto }] : [];
  });
  const grupos = agruparPorCategoria(conProducto, ({ producto }) => producto.categoria);

  return (
    // overflow-clip (no hidden): recorta las esquinas sin romper los encabezados sticky.
    <div className="overflow-clip rounded-xl border bg-card">
      {grupos.map(({ categoria, items }) => (
        <section key={categoria} aria-label={categoria}>
          <EncabezadoCategoria categoria={categoria} fijo />
          <ul className="divide-y">
            {items.map(({ linea, producto }) => (
              <li key={producto.id} className="flex items-center gap-2 px-3 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:size-9"
                  aria-label={`Quitar ${producto.nombre} del pedido`}
                  onClick={() => onQuitar(producto.id)}
                >
                  <X />
                </Button>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{producto.nombre}</p>
                  <p className="font-mono text-xs text-muted-foreground">{producto.sku}</p>
                </div>

                <SelectorCantidad
                  cantidad={linea.cantidad}
                  producto={producto.nombre}
                  onCambiar={(cantidad) => onCambiarCantidad(producto.id, cantidad)}
                />
                <span className="w-14 shrink-0 text-xs text-muted-foreground uppercase">
                  {producto.unidad}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
