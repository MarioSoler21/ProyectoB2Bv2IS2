"use client";

import { useTransition } from "react";
import { Loader2, Pencil, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { totalEstimado } from "@/lib/portal/borrador";
import type { DiaEntrega } from "@/lib/portal/fechas";
import { contar, formatearCantidad, formatearMoneda } from "@/lib/portal/formato";
import type { FechaISO, PedidoNuevo, ProductoPortal } from "@/lib/portal/types";

import { enviarCarrito } from "../actions";

type Props = {
  token: string;
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  pedidos: PedidoNuevo[];
  dias: DiaEntrega[];
  productosPorId: ReadonlyMap<number, ProductoPortal>;
  onQuitar: (fecha: FechaISO) => void;
  onEditar: (fecha: FechaISO) => void;
  onEnviado: () => void;
  /** Variables de marca del tenant: el Sheet se renderiza fuera del wrapper que las define. */
  style?: React.CSSProperties;
};

/** Carrito en hoja inferior: revisa los pedidos por día y los envía todos juntos. */
export function Carrito({
  token,
  abierto,
  onAbiertoChange,
  pedidos,
  dias,
  productosPorId,
  onQuitar,
  onEditar,
  onEnviado,
  style,
}: Props) {
  const [enviando, iniciarEnvio] = useTransition();
  const diaPorFecha = new Map(dias.map((d) => [d.fecha, d]));
  const total = pedidos.reduce((t, p) => t + totalEstimado(p.lineas, productosPorId), 0);

  function enviar() {
    iniciarEnvio(async () => {
      const resultado = await enviarCarrito(token, pedidos);
      if (!resultado.ok) {
        toast.error(resultado.error);
        return;
      }
      const numeros = resultado.numeros.map((n) => `#${n}`).join(", ");
      toast.success(
        resultado.numeros.length === 1 ? `¡Pedido ${numeros} enviado!` : `¡Pedidos ${numeros} enviados!`,
        { description: "Ya lo recibimos y lo vamos a preparar." },
      );
      onEnviado();
    });
  }

  return (
    <Sheet open={abierto} onOpenChange={onAbiertoChange}>
      <SheetContent
        side="bottom"
        style={style}
        className="mx-auto max-h-[90vh] max-w-2xl gap-0 rounded-t-2xl"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2 text-lg font-bold">
            <ShoppingCart className="size-5 text-primary" aria-hidden /> Carrito
          </SheetTitle>
          <SheetDescription>
            {pedidos.length === 0
              ? "Arma un pedido y añádelo para enviarlo."
              : `${contar(pedidos.length, "pedido")} listo${pedidos.length === 1 ? "" : "s"} para enviar.`}
          </SheetDescription>
        </SheetHeader>

        {pedidos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <ShoppingCart className="size-10 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">El carrito está vacío.</p>
            <Button variant="outline" onClick={() => onAbiertoChange(false)}>
              Armar un pedido
            </Button>
          </div>
        ) : (
          <>
            <ul className="divide-y overflow-y-auto">
              {pedidos.map((pedido) => {
                const dia = diaPorFecha.get(pedido.fechaEntrega);
                return (
                  <li key={pedido.fechaEntrega} className="space-y-2 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          Entrega: {dia ? `${dia.etiqueta} ${dia.fechaCorta}` : pedido.fechaEntrega}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contar(pedido.lineas.length, "producto")} ·{" "}
                          {formatearMoneda(totalEstimado(pedido.lineas, productosPorId))}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar este pedido"
                        onClick={() => onEditar(pedido.fechaEntrega)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Quitar este pedido del carrito"
                        onClick={() => onQuitar(pedido.fechaEntrega)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {pedido.lineas
                        .map((l) => {
                          const p = productosPorId.get(l.productoId);
                          return p ? `${formatearCantidad(l.cantidad)} ${p.unidad} ${p.nombre}` : null;
                        })
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {pedido.notas && (
                      <p className="text-xs text-muted-foreground italic">“{pedido.notas}”</p>
                    )}
                  </li>
                );
              })}
            </ul>

            <SheetFooter className="border-t">
              <p className="flex justify-between text-sm text-muted-foreground">
                <span>Total estimado</span>
                <span className="text-base font-bold text-foreground tabular-nums">
                  {formatearMoneda(total)}
                </span>
              </p>
              <Button
                size="lg"
                className="h-12 w-full rounded-xl text-base font-bold"
                disabled={enviando}
                onClick={enviar}
              >
                {enviando ? (
                  <>
                    <Loader2 className="animate-spin" /> Enviando…
                  </>
                ) : (
                  `Enviar ${contar(pedidos.length, "pedido")}`
                )}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
