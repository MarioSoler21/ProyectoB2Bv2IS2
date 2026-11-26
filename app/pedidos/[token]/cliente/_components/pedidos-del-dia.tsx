"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PedidoVista } from "@/lib/portal/types";

import { TarjetaPedido } from "./tarjeta-pedido";

/** Pedidos ya enviados para el día elegido + opción de hacer otro. */
export function PedidosDelDia({
  pedidos,
  onHacerOtro,
}: {
  pedidos: PedidoVista[];
  onHacerOtro: () => void;
}) {
  return (
    <section aria-label="Pedidos de este día" className="space-y-3">
      {pedidos.map((pedido, i) => (
        <TarjetaPedido key={pedido.id} pedido={pedido} ordinal={i + 1} />
      ))}
      <Button variant="outline" className="h-11 w-full rounded-xl font-semibold" onClick={onHacerOtro}>
        <Plus /> Hacer otro pedido para este día
      </Button>
    </section>
  );
}
