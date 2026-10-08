// Toda conversión de zona horaria ocurre AQUÍ, en el frontend. El backend guarda UTC.
// Se muestra en America/Bogota. "Hoy"/"Ayer" en palabras; de ahí para atrás, "08 SEP".
// El año solo aparece si no es el actual.

const TZ = "America/Bogota";

const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

// Devuelve {y, m, d} de una fecha en la zona de Bogotá.
function partsInTZ(date: Date): { y: number; m: number; d: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(date).split("-").map(Number);
  return { y, m, d };
}

function sameDay(a: { y: number; m: number; d: number }, b: { y: number; m: number; d: number }) {
  return a.y === b.y && a.m === b.m && a.d === b.d;
}

export function formatEventDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const p = partsInTZ(date);
  const today = partsInTZ(now);
  const yesterday = partsInTZ(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  if (sameDay(p, today)) return "Hoy";
  if (sameDay(p, yesterday)) return "Ayer";

  const base = `${String(p.d).padStart(2, "0")} ${MESES[p.m - 1]}`;
  return p.y === today.y ? base : `${base} ${p.y}`;
}

// Para el atributo datetime / tooltip: fecha y hora completas en Bogotá.
export function formatFull(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

// Valor para <input type="date"> (YYYY-MM-DD) en la zona de Bogotá.
export function toDateInputValue(date: Date): string {
  const p = partsInTZ(date);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

// Convierte el YYYY-MM-DD de un <input type="date"> a un Date a mediodía de Bogotá,
// para que no cruce de día al pasar a UTC.
export function fromDateInputValue(value: string): Date {
  // Bogotá es UTC-5 todo el año; mediodía local = 17:00 UTC, sin ambigüedad de día.
  return new Date(`${value}T12:00:00-05:00`);
}
