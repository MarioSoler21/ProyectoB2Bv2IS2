import { IsotipoPedidly } from "@/components/logo-pedidly";
import { cn } from "@/lib/utils";
import { BRANDING_DEFAULTS } from "@/lib/branding";

/**
 * Marca del tenant. Si configuró un logo (logoUrl) se muestra ese; si no, el
 * isotipo de Pedidly. El wordmark usa el nombre/subtítulo del tenant o los
 * defaults del producto.
 */
export function BrandLogo({
  withWordmark = false,
  logoUrl,
  nombre,
  subtitulo,
  className,
}: {
  withWordmark?: boolean;
  logoUrl?: string | null;
  nombre?: string | null;
  subtitulo?: string | null;
  className?: string;
}) {
  const label = nombre?.trim() || BRANDING_DEFAULTS.nombreApp;
  const sub = subtitulo?.trim() || BRANDING_DEFAULTS.subtituloApp;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {logoUrl ? (
        // Alto fijo y ancho libre: los logos suelen ser horizontales. En oscuro
        // va sobre una placa clara para que no se pierdan las partes negras.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={label}
          className="h-9 w-auto max-w-28 shrink-0 rounded-md object-contain dark:bg-white dark:p-0.5"
        />
      ) : (
        <IsotipoPedidly className="shrink-0" />
      )}
      {withWordmark && (
        <div className="leading-tight">
          <p className="font-heading text-sm font-semibold text-foreground">
            {label}
          </p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      )}
    </div>
  );
}
