export function formatDateIt(iso: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00`));
}

/** Lunedì della settimana contenente la data data (o oggi), come ISO yyyy-mm-dd. */
export function startOfWeek(offsetWeeks = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const day = (date.getDay() + 6) % 7; // 0 = lunedì
  date.setDate(date.getDate() - day + offsetWeeks * 7);
  return date.toISOString().slice(0, 10);
}

export function endOfWeek(offsetWeeks = 0) {
  const start = new Date(`${startOfWeek(offsetWeeks)}T00:00:00`);
  start.setDate(start.getDate() + 6);
  return start.toISOString().slice(0, 10);
}

export function formatDateItShort(iso: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" }).format(
    new Date(`${iso}T00:00:00`),
  );
}

export function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Giallo quando la scadenza è ancora lontana, arancione quando si avvicina,
 * rosso se è scaduta. Senza scadenza resta giallo (non ancora programmata).
 */
export function paymentStatusColor(dueDate: string | null, paid: boolean) {
  if (paid) return { label: "Pagata", color: "green" as const };
  if (!dueDate) return { label: "Da programmare", color: "amber" as const };
  const diff = daysUntil(dueDate);
  if (diff < 0) return { label: "Scaduta", color: "red" as const };
  if (diff <= 14) return { label: "In scadenza", color: "orange" as const };
  return { label: "Da pagare", color: "amber" as const };
}
