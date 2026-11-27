import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { DashboardNav } from "@/components/dashboard-nav";
import { ConTecnologiaPedidly } from "@/components/logo-pedidly";
import { MarcaDeAgua } from "@/components/marca-de-agua";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getSession, type Session } from "@/lib/session";
import { getTenantBranding } from "@/lib/data/admin";
import { brandingStyle, type TenantBranding } from "@/lib/branding";
import { ROL_LABEL } from "@/lib/admin-labels";
import { seccionesPermitidas } from "@/lib/auth/permisos";
import { salirDelTenant, cambiarNegocio } from "./actions";
import { MenuMovil } from "./_components/menu-movil";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getSession();

  if (!tenant) {
    redirect("/login");
  }

  const branding = await getTenantBranding(tenant.id);
  const logo = (
    <BrandLogo
      withWordmark
      logoUrl={branding.logoUrl}
      nombre={branding.nombreApp}
      subtitulo={branding.subtituloApp}
    />
  );

  return (
    // isolate: la marca de agua (z negativo) queda sobre el fondo pero debajo de todo lo demás.
    <div
      className="relative isolate flex min-h-screen bg-muted/40"
      style={brandingStyle(branding)}
    >
      <MarcaDeAgua logoUrl={branding.logoUrl} />

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar p-4 text-sidebar-foreground md:flex">
        <ContenidoLateral logo={logo} tenant={tenant} branding={branding} />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b bg-sidebar px-3 py-2 text-sidebar-foreground md:hidden">
          {logo}
          <MenuMovil>
            <ContenidoLateral logo={logo} tenant={tenant} branding={branding} />
          </MenuMovil>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Marca, navegación y datos de la cuenta: barra lateral en escritorio y menú en móvil. */
function ContenidoLateral({
  logo,
  tenant,
  branding,
}: {
  logo: React.ReactNode;
  tenant: Session;
  branding: TenantBranding;
}) {
  return (
    <div className="flex h-full flex-col justify-between gap-6 overflow-y-auto">
      <div>
        <div className="flex items-center justify-between gap-2 px-1 py-1">
          {logo}
          <ThemeToggle />
        </div>
        <Separator className="my-4" />
        <DashboardNav permitidas={seccionesPermitidas(tenant.rol)} />
      </div>

      <div className="space-y-2">
        <Separator />
        <div className="px-2">
          <p className="text-xs font-medium text-foreground">
            {branding.nombreEmpresa || tenant.nombreEmpresa}
          </p>
          <p className="text-xs text-muted-foreground">
            {tenant.email} · {ROL_LABEL[tenant.rol] ?? tenant.rol}
          </p>
        </div>
        {tenant.negocios.length > 1 && (
          <div className="space-y-1">
            {tenant.negocios.map((negocio) => (
              <form key={negocio.tenantId} action={cambiarNegocio}>
                <input type="hidden" name="tenantId" value={negocio.tenantId} />
                <Button
                  type="submit"
                  variant={negocio.tenantId === tenant.id ? "secondary" : "ghost"}
                  size="sm"
                  disabled={negocio.tenantId === tenant.id}
                  className="w-full justify-start"
                >
                  {negocio.nombreEmpresa}
                </Button>
              </form>
            ))}
          </div>
        )}
        <form action={salirDelTenant}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
          >
            Cerrar sesión
          </Button>
        </form>
        <ConTecnologiaPedidly className="px-2 pt-1" />
      </div>
    </div>
  );
}
