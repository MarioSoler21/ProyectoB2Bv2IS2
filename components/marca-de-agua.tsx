/**
 * Logo del tenant como marca de agua: grande, difuminado y muy tenue, detrás
 * de todo el contenido (z negativo dentro de un contenedor con `isolate`).
 * Las tarjetas son opacas, así que solo se ve en los espacios libres y nunca
 * compite con la información.
 */
export function MarcaDeAgua({ logoUrl }: { logoUrl: string | null | undefined }) {
  if (!logoUrl) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center overflow-hidden md:left-60"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- decorativa, sin optimizar */}
      <img
        src={logoUrl}
        alt=""
        className="w-[min(80%,760px)] opacity-[0.07] blur-[3px] select-none dark:opacity-[0.06] dark:brightness-0 dark:invert"
      />
    </div>
  );
}
