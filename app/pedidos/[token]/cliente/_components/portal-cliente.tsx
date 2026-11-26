"use client";

import { useEffect, useMemo, useState } from "react";

import { useHidratado } from "@/hooks/use-local-storage";
import type { PortalData } from "@/lib/data/portal";
import type { FechaISO, PedidoNuevo } from "@/lib/portal/types";

import { limpiarBorradoresVencidos } from "../_hooks/use-borrador";
import { useCarrito } from "../_hooks/use-carrito";
import { ArmadoPedido } from "./armado-pedido";
import { Carrito } from "./carrito";
import { EncabezadoPortal } from "./encabezado-portal";
import { EsqueletoArmado } from "./esqueleto-armado";
import { PedidosDelDia } from "./pedidos-del-dia";
import { SelectorDia } from "./selector-dia";

type Props = PortalData & {
  token: string;
  /** Variables CSS de la marca del tenant. */
  estiloMarca: React.CSSProperties;
};

/**
 * Pantalla del portal de cliente. Coordina el día elegido, el carrito y qué
 * se muestra para ese día: los pedidos ya enviados o el armado de uno nuevo.
 */
export function PortalCliente({
  token,
  estiloMarca,
  cliente,
  productos,
  dias,
  pedidos,
  sugerencias,
}: Props) {
  const hoy = dias[0].fecha;
  const hidratado = useHidratado();
  const carrito = useCarrito(token, hoy);

  // Por defecto "Mañana": es para cuando se pide la gran mayoría de las veces.
  const [fecha, setFecha] = useState<FechaISO>(dias[1]?.fecha ?? hoy);
  const [armandoOtroPara, setArmandoOtroPara] = useState<FechaISO | null>(null);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  useEffect(() => limpiarBorradoresVencidos(token, hoy), [token, hoy]);

  const productosPorId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);
  const fechasConPedido = useMemo(() => new Set(pedidos.map((p) => p.fechaEntrega)), [pedidos]);
  const fechasEnCarrito = useMemo(
    () => new Set(carrito.pedidos.map((p) => p.fechaEntrega)),
    [carrito.pedidos],
  );

  const pedidosDelDia = pedidos.filter((p) => p.fechaEntrega === fecha);
  const enCarrito = carrito.pedidos.find((p) => p.fechaEntrega === fecha);
  const mostrarEnviados =
    pedidosDelDia.length > 0 && armandoOtroPara !== fecha && !enCarrito;

  function seleccionarDia(nueva: FechaISO) {
    setFecha(nueva);
    setArmandoOtroPara(null);
  }

  function agregarAlCarrito(pedido: PedidoNuevo) {
    carrito.guardarPedido(pedido);
    setCarritoAbierto(true);
  }

  function editarDesdeCarrito(fechaPedido: FechaISO) {
    setFecha(fechaPedido);
    setArmandoOtroPara(fechaPedido);
    setCarritoAbierto(false);
  }

  function alEnviar() {
    carrito.vaciar();
    setArmandoOtroPara(null);
    setCarritoAbierto(false);
  }

  return (
    <div style={estiloMarca} className="min-h-screen bg-background">
      <EncabezadoPortal
        cliente={cliente}
        pedidosEnCarrito={hidratado ? carrito.pedidos.length : 0}
        onAbrirCarrito={() => setCarritoAbierto(true)}
      />

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-5 pb-16">
        {cliente.branding.mensajePortal && (
          <p className="text-sm text-muted-foreground">{cliente.branding.mensajePortal}</p>
        )}

        <SelectorDia
          dias={dias}
          seleccionado={fecha}
          conPedido={fechasConPedido}
          enCarrito={hidratado ? fechasEnCarrito : new Set()}
          onSeleccionar={seleccionarDia}
        />

        {mostrarEnviados ? (
          <PedidosDelDia pedidos={pedidosDelDia} onHacerOtro={() => setArmandoOtroPara(fecha)} />
        ) : hidratado ? (
          <ArmadoPedido
            key={fecha}
            token={token}
            fecha={fecha}
            productos={productos}
            productosPorId={productosPorId}
            sugerencia={sugerencias[fecha] ?? []}
            enCarrito={enCarrito}
            onAgregarAlCarrito={agregarAlCarrito}
          />
        ) : (
          <EsqueletoArmado />
        )}
      </main>

      <Carrito
        token={token}
        abierto={carritoAbierto}
        onAbiertoChange={setCarritoAbierto}
        pedidos={carrito.pedidos}
        dias={dias}
        productosPorId={productosPorId}
        onQuitar={carrito.quitarPedido}
        onEditar={editarDesdeCarrito}
        onEnviado={alEnviar}
        style={estiloMarca}
      />
    </div>
  );
}
