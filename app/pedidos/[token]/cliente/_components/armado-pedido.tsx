"use client";

import { useMemo } from "react";
import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  agregarUno,
  aPedidoNuevo,
  borradorInicial,
  fijarCantidad,
  NOTAS_MAX_CARACTERES,
  quitarLinea,
  totalEstimado,
} from "@/lib/portal/borrador";
import { contar, formatearMoneda } from "@/lib/portal/formato";
import type { FechaISO, LineaPedido, PedidoNuevo, ProductoPortal } from "@/lib/portal/types";

import { useBorrador } from "../_hooks/use-borrador";
import { AvisoSugerencia } from "./aviso-sugerencia";
import { BuscadorProductos } from "@/components/pedido/buscador-productos";
import { LineasPedido } from "@/components/pedido/lineas-pedido";

type Props = {
  token: string;
  fecha: FechaISO;
  productos: ProductoPortal[];
  productosPorId: ReadonlyMap<number, ProductoPortal>;
  sugerencia: LineaPedido[];
  enCarrito: PedidoNuevo | undefined;
  onAgregarAlCarrito: (pedido: PedidoNuevo) => void;
};

/** Armado del pedido de un día: buscador + líneas + notas + "Añadir al carrito". */
export function ArmadoPedido({
  token,
  fecha,
  productos,
  productosPorId,
  sugerencia,
  enCarrito,
  onAgregarAlCarrito,
}: Props) {
  const inicial = useMemo(() => borradorInicial(enCarrito, sugerencia), [enCarrito, sugerencia]);
  const { borrador, actualizar, descartar } = useBorrador(token, fecha, inicial);
  const { lineas, notas } = borrador;

  const cambiarLineas = (cambio: (actuales: LineaPedido[]) => LineaPedido[]) =>
    actualizar((b) => ({ ...b, lineas: cambio(b.lineas) }));

  function agregarAlCarrito() {
    onAgregarAlCarrito(aPedidoNuevo(fecha, borrador));
    // El carrito pasa a ser la fuente de verdad de este día.
    descartar();
  }

  const total = totalEstimado(lineas, productosPorId);
  const mostrarAviso = borrador.origen === "sugerencia" && !borrador.avisoCerrado;

  return (
    <div className="space-y-6">
      {mostrarAviso && (
        <AvisoSugerencia onCerrar={() => actualizar((b) => ({ ...b, avisoCerrado: true }))} />
      )}

      <BuscadorProductos
        productos={productos}
        lineas={lineas}
        onAgregar={(id) => cambiarLineas((ls) => agregarUno(ls, id))}
      />

      <section aria-labelledby="titulo-tu-pedido" className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2
            id="titulo-tu-pedido"
            className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            Tu pedido
          </h2>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {contar(lineas.length, "producto")}
          </span>
        </div>

        {lineas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center">
            <ShoppingCart className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Todavía no agregaste productos. Búscalos arriba por nombre o código.
            </p>
          </div>
        ) : (
          <LineasPedido
            lineas={lineas}
            productosPorId={productosPorId}
            onCambiarCantidad={(id, cantidad) => cambiarLineas((ls) => fijarCantidad(ls, id, cantidad))}
            onQuitar={(id) => cambiarLineas((ls) => quitarLinea(ls, id))}
          />
        )}
      </section>

      <div className="space-y-2">
        <Label htmlFor={`notas-${fecha}`}>Notas (opcional)</Label>
        <Textarea
          id={`notas-${fecha}`}
          placeholder="Indicaciones especiales para la entrega…"
          maxLength={NOTAS_MAX_CARACTERES}
          value={notas}
          onChange={(e) => actualizar((b) => ({ ...b, notas: e.target.value }))}
          className="min-h-20 resize-none rounded-xl"
        />
      </div>

      <div className="space-y-2">
        {lineas.length > 0 && (
          <p className="flex justify-between text-sm text-muted-foreground">
            <span>Total estimado</span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatearMoneda(total)}
            </span>
          </p>
        )}
        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-xl text-base font-bold"
          disabled={lineas.length === 0}
          onClick={agregarAlCarrito}
        >
          <ShoppingCart />
          {enCarrito ? "Actualizar carrito" : "Añadir al carrito"}
          {lineas.length > 0 && ` · ${contar(lineas.length, "producto")}`}
        </Button>
      </div>
    </div>
  );
}
