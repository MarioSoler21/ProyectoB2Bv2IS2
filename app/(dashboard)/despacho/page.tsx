import type { Metadata } from "next";

import { exigirPermiso } from "@/lib/auth/acceso";
import { getTableroDespacho } from "@/lib/data/despacho";

import { TableroDespacho } from "./_components/tablero-despacho";

export const metadata: Metadata = { title: "Despacho" };

export default async function DespachoPage() {
  const sesion = await exigirPermiso("despachar");
  const tablero = await getTableroDespacho(sesion.id);
  return <TableroDespacho empresa={sesion.nombreEmpresa} {...tablero} />;
}
