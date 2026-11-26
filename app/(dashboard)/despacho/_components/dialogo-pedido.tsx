"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { BuscadorProductos } from "@/components/pedido/buscador-productos";
import { LineasPedido } from "@/components/pedido/lineas-pedido";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { estaDespachado } from "@/lib/despacho/filtros";
import type { PedidoDespacho } from "@/lib/despacho/types";
import {
  agregarUno,
  fijarCantidad,
  NOTAS_MAX_CARACTERES,
  quitarLinea,
  totalEstimado,
} from "@/lib/portal/borrador";
import { contar, formatearMoneda } from "@/lib/portal/formato";
import type { LineaPedido, ProductoPortal } from "@/lib/portal/types";

import { anular, guardarPedido } from "../actions";

type Props = {
  pedido: PedidoDespacho | null;
  catalogo: ProductoPortal[];
  productosPorId: ReadonlyMap<number, ProductoPortal>;
  onCerrar: () => void;
};

/**
 * Detalle editable de un pedido. En escritorio es un modal centrado; en
 * móvil sube desde abajo (bottom sheet) con el pie de acciones fijo.
 */
export function DialogoPedido({ pedido, catalogo, productosPorId, onCerrar }: Props) {
  return (
    <Dialog open={pedido !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none sm:max-w-lg">
        {/* key: al abrir otro pedido el formulario arranca de cero. */}
        {pedido && (
          <EdicionPedido
            key={pedido.id}
            pedido={pedido}
            catalogo={catalogo}
            productosPorId={productosPorId}
            onCerrar={onCerrar}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EdicionPedido({
  pedido,
  catalogo,
  productosPorId,
  onCerrar,
}: Props & { pedido: PedidoDespacho }) {
  const [lineas, setLineas] = useState<LineaPedido[]>(pedido.lineas);
  const [notas, setNotas] = useState(pedido.notas ?? "");
  const [guardando, iniciar] = useTransition();

  const soloLectura = estaDespachado(pedido.estado);
  const huboCambios =
    notas.trim() !== (pedido.notas ?? "").trim() ||
    JSON.stringify(lineas) !== JSON.stringify(pedido.lineas);

  function guardar() {
    iniciar(async () => {
      const resultado = await guardarPedido({ id: pedido.id, lineas, notas });
      if (!resultado.ok) {
        toast.error(resultado.error);
        return;
      }
      toast.success(`Pedido #${pedido.numero} actualizado`);
      onCerrar();
    });
  }

  function anularPedido() {
    iniciar(async () => {
      const resultado = await anular(pedido.id);
      if (!resultado.ok) {
        toast.error(resultado.error);
        return;
      }
      toast.success(`Pedido #${pedido.numero} anulado`);
      onCerrar();
    });
  }

  return (
    <>
      <DialogHeader className="border-b p-4 pr-12">
        <DialogTitle className="text-base font-bold">{pedido.cliente.nombre}</DialogTitle>
        <DialogDescription>
          Pedido #{pedido.numero} · {contar(lineas.length, "producto")}
          {pedido.ruta && ` · ${pedido.ruta.nombre}`}
        </DialogDescription>
      </DialogHeader>

      {/* fieldset disabled: un pedido que ya salió se ve pero no se toca. */}
      <fieldset disabled={soloLectura || guardando} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {soloLectura && (
          <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            Este pedido ya fue despachado; no se puede editar.
          </p>
        )}

        {!soloLectura && (
          <BuscadorProductos
            productos={catalogo}
            lineas={lineas}
            onAgregar={(id) => setLineas((actual) => agregarUno(actual, id))}
          />
        )}

        {lineas.length > 0 ? (
          <LineasPedido
            lineas={lineas}
            productosPorId={productosPorId}
            onCambiarCantidad={(id, cantidad) => setLineas((actual) => fijarCantidad(actual, id, cantidad))}
            onQuitar={(id) => setLineas((actual) => quitarLinea(actual, id))}
          />
        ) : (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            El pedido no tiene productos. Agrega al menos uno para guardarlo.
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor={`notas-${pedido.id}`}>Notas</Label>
          <Textarea
            id={`notas-${pedido.id}`}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            maxLength={NOTAS_MAX_CARACTERES}
            placeholder="Indicaciones para la entrega…"
            className="min-h-20"
          />
        </div>
      </fieldset>

      <DialogFooter className="m-0 flex-col gap-2 rounded-none border-t bg-transparent p-4 sm:flex-col">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total estimado</span>
          <span className="font-semibold tabular-nums">
            {formatearMoneda(totalEstimado(lineas, productosPorId))}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-10" onClick={onCerrar} disabled={guardando}>
            {soloLectura ? "Cerrar" : "Cancelar"}
          </Button>
          <Button
            className="h-10 font-semibold"
            onClick={guardar}
            disabled={soloLectura || guardando || !huboCambios || lineas.length === 0}
          >
            {guardando ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
        {!soloLectura && (
          <ConfirmarAnulacion numero={pedido.numero} deshabilitado={guardando} onConfirmar={anularPedido} />
        )}
      </DialogFooter>
    </>
  );
}

function ConfirmarAnulacion({
  numero,
  deshabilitado,
  onConfirmar,
}: {
  numero: number;
  deshabilitado: boolean;
  onConfirmar: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="h-9 w-full" disabled={deshabilitado}>
          <Trash2 /> Anular pedido
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Anular el pedido #{numero}?</AlertDialogTitle>
          <AlertDialogDescription>
            Sale del tablero y no se despacha. Queda registrado en el historial del pedido.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Volver</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirmar}>
            Anular pedido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
