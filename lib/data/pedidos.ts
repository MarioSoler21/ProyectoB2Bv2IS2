export const FLUJO_ESTADOS = [
  "pendiente",
  "confirmado",
  "en_preparacion",
  "despachado",
  "entregado",
] as const;

export type EstadoPedido = (typeof FLUJO_ESTADOS)[number] | "anulado";
