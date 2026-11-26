import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { brandingStyle } from "@/lib/branding";
import { getClientePorToken, getPortalData } from "@/lib/data/portal";

import { PortalCliente } from "./_components/portal-cliente";

/** Azul de acción del portal cuando el tenant no configuró un color primario. */
const PRIMARIO_PORTAL = "#2563eb";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const cliente = await getClientePorToken(token);
  return { title: cliente ? `Pedidos · ${cliente.tenantNombre}` : "Hacer pedido" };
}

export default async function PortalClientePage({ params }: Props) {
  const { token } = await params;
  const data = await getPortalData(token);
  if (!data) notFound();

  const { branding } = data.cliente;
  const estiloMarca = brandingStyle({
    ...branding,
    colorPrimario: branding.colorPrimario ?? PRIMARIO_PORTAL,
  });

  return <PortalCliente token={token} estiloMarca={estiloMarca} {...data} />;
}
