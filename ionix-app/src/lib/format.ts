export function formatDateIt(iso: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00`));
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
