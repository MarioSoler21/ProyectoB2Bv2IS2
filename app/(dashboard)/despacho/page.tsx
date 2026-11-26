import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getTableroDespacho } from "@/lib/data/despacho";
import { getSession } from "@/lib/session";

import { TableroDespacho } from "./_components/tablero-despacho";

export const metadata: Metadata = { title: "Despacho" };

export default async function DespachoPage() {
  const sesion = await getSession();
  if (!sesion) redirect("/login");

  const tablero = await getTableroDespacho(sesion.id);
  return <TableroDespacho empresa={sesion.nombreEmpresa} {...tablero} />;
}
