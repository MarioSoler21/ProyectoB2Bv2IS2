import Image from "next/image";

import { PRODUCTO } from "@/lib/branding";
import { cn } from "@/lib/utils";
import isotipo from "@/public/brand/pedidly-isotipo.png";
import logoClaro from "@/public/brand/pedidly.png";
import logoOscuro from "@/public/brand/pedidly-oscuro.png";

/**
 * Marca del producto (Pedidly), no la del tenant. El texto del logo es azul
 * marino, así que en tema oscuro se usa la versión con el texto en blanco.
 */
export function LogoPedidly({ className, priority }: { className?: string; priority?: boolean }) {
  const clases = cn("h-10 w-auto", className);
  return (
    <>
      <Image src={logoClaro} alt={PRODUCTO.nombre} priority={priority} className={cn(clases, "dark:hidden")} />
      <Image
        src={logoOscuro}
        alt={PRODUCTO.nombre}
        priority={priority}
        className={cn(clases, "hidden dark:block")}
      />
    </>
  );
}

/** Solo la "P": para espacios chicos o cuando el tenant no tiene logo. */
export function IsotipoPedidly({ className }: { className?: string }) {
  return <Image src={isotipo} alt={PRODUCTO.nombre} className={cn("size-9", className)} />;
}

/** Firma discreta del SaaS dentro de espacios con la marca del tenant. */
export function ConTecnologiaPedidly({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      Con tecnología de
      <Image src={isotipo} alt="" className="size-4" />
      <span className="font-semibold text-foreground">{PRODUCTO.nombre}</span>
    </p>
  );
}
