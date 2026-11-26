"use client";

import { ShoppingCart } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { ClientePortal } from "@/lib/portal/types";

type Props = {
  cliente: ClientePortal;
  pedidosEnCarrito: number;
  onAbrirCarrito: () => void;
};

export function EncabezadoPortal({ cliente, pedidosEnCarrito, onAbrirCarrito }: Props) {
  const { branding } = cliente;

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-5 pb-4">
        <BrandLogo logoUrl={branding.logoUrl} nombre={branding.nombreApp} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl leading-tight font-bold uppercase sm:text-2xl">
            {cliente.tenantNombre}
          </h1>
          <p className="truncate text-sm text-muted-foreground">{cliente.nombreNegocio}</p>
        </div>

        <Button
          variant="ghost"
          size="icon-lg"
          className="relative"
          aria-label={`Abrir carrito (${pedidosEnCarrito} pedidos)`}
          onClick={onAbrirCarrito}
        >
          <ShoppingCart className="size-5" />
          {pedidosEnCarrito > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {pedidosEnCarrito}
            </span>
          )}
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
