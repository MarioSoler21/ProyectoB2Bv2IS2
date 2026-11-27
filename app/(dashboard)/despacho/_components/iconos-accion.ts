import { CircleCheck, PackageCheck, PackageOpen, Truck, type LucideIcon } from "lucide-react";

import type { EstadoAvance } from "@/lib/despacho/ciclo";

/** Ícono del botón que lleva a cada estado (tarjeta y barra de selección). */
export const ICONO_ACCION: Record<EstadoAvance, LucideIcon> = {
  confirmado: CircleCheck,
  en_preparacion: PackageOpen,
  despachado: Truck,
  entregado: PackageCheck,
};
