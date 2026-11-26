import type { FechaISO } from "./types";

/**
 * Fechas del portal. Todo se calcula en la zona horaria del negocio (no la
 * del servidor ni la del navegador) y se formatea en el servidor, para que
 * "Hoy"/"Mañana" signifiquen lo mismo para todos y no haya diferencias de
 * hidratación entre Node y el navegador.
 */

export const ZONA_HORARIA = "America/Tegucigalpa";

/** Cuántos días hacia adelante puede elegir el cliente (incluye hoy). */
export const DIAS_SELECCIONABLES = 8;

export type DiaEntrega = {
  fecha: FechaISO;
  /** "Hoy", "Mañana" o el día de la semana abreviado ("Jue"). */
  etiqueta: string;
  /** "27 nov" */
  fechaCorta: string;
};

const formatoISO = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA });
const formatoHora = new Intl.DateTimeFormat("es", {
  timeZone: ZONA_HORARIA,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});
// Las fechas de calendario se manejan como medianoche UTC: así sumar días o
// sacar el día de la semana no depende de la zona horaria del proceso.
const formatoDiaSemana = new Intl.DateTimeFormat("es", {
  timeZone: "UTC",
  weekday: "short",
});
const formatoDiaSemanaLargo = new Intl.DateTimeFormat("es", {
  timeZone: "UTC",
  weekday: "long",
});
const formatoFechaCorta = new Intl.DateTimeFormat("es", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

function aFechaUTC(fecha: FechaISO): Date {
  return new Date(`${fecha}T00:00:00Z`);
}

function sinPunto(texto: string): string {
  return texto.replace(/\.$/, "");
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function hoyISO(ahora: Date = new Date()): FechaISO {
  return formatoISO.format(ahora);
}

export function sumarDias(fecha: FechaISO, dias: number): FechaISO {
  const d = aFechaUTC(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** 0 = domingo … 6 = sábado (mismo criterio que plantillas_pedido.dia_semana). */
export function diaSemana(fecha: FechaISO): number {
  return aFechaUTC(fecha).getUTCDay();
}

export function fechaCorta(fecha: FechaISO): string {
  return sinPunto(formatoFechaCorta.format(aFechaUTC(fecha)));
}

export function proximosDias(
  hoy: FechaISO,
  cantidad: number = DIAS_SELECCIONABLES,
): DiaEntrega[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = sumarDias(hoy, i);
    const etiqueta =
      i === 0
        ? "Hoy"
        : i === 1
          ? "Mañana"
          : capitalizar(sinPunto(formatoDiaSemana.format(aFechaUTC(fecha))));
    return { fecha, etiqueta, fechaCorta: fechaCorta(fecha) };
  });
}

/** "Hoy", "Mañana", "Ayer" o "Jueves 26 nov". */
export function etiquetaDia(fecha: FechaISO, hoy: FechaISO): string {
  if (fecha === hoy) return "Hoy";
  if (fecha === sumarDias(hoy, 1)) return "Mañana";
  if (fecha === sumarDias(hoy, -1)) return "Ayer";
  return `${capitalizar(formatoDiaSemanaLargo.format(aFechaUTC(fecha)))} ${fechaCorta(fecha)}`;
}

export function esFechaSeleccionable(fecha: FechaISO, hoy: FechaISO): boolean {
  return fecha >= hoy && fecha <= sumarDias(hoy, DIAS_SELECCIONABLES - 1);
}

/** "Hoy · 02:58 p. m." o "25 nov · 02:58 p. m." */
export function formatearMomento(instante: string, hoy: FechaISO): string {
  const fecha = new Date(instante);
  const dia = hoyISO(fecha);
  const etiquetaDia = dia === hoy ? "Hoy" : fechaCorta(dia);
  return `${etiquetaDia} · ${formatoHora.format(fecha)}`;
}
