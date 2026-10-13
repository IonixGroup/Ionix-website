"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { formatDateIt } from "@/lib/format";

type Milestone = Database["public"]["Tables"]["milestones"]["Row"];

export default function MilestonesClient({
  projectId,
  initialMilestones,
}: {
  projectId: string;
  initialMilestones: Milestone[];
}) {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPayment, setIsPayment] = useState(false);
  const [paymentLabel, setPaymentLabel] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  async function handleAdd() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("milestones")
      .insert({
        project_id: projectId,
        title: title.trim(),
        position: milestones.length,
        due_date: dueDate || null,
        is_payment: isPayment,
        payment_label: isPayment ? paymentLabel.trim() || title.trim() : null,
        payment_amount: isPayment && paymentAmount ? Number(paymentAmount) : null,
      })
      .select()
      .single();

    setSaving(false);

    if (insertError || !data) {
      setError("Salvataggio non riuscito: " + (insertError?.message ?? ""));
      return;
    }

    setMilestones((prev) => [...prev, data]);
    setTitle("");
    setDueDate("");
    setIsPayment(false);
    setPaymentLabel("");
    setPaymentAmount("");
  }

  async function toggleCompleted(m: Milestone) {
    const nextCompletedAt = m.completed_at ? null : new Date().toISOString();
    setMilestones((prev) =>
      prev.map((row) => (row.id === m.id ? { ...row, completed_at: nextCompletedAt } : row)),
    );
    await supabase.from("milestones").update({ completed_at: nextCompletedAt }).eq("id", m.id);
  }

  async function togglePaid(m: Milestone) {
    const nextPaid = !m.payment_paid;
    const nextPaidAt = nextPaid ? new Date().toISOString() : null;
    setMilestones((prev) =>
      prev.map((row) =>
        row.id === m.id ? { ...row, payment_paid: nextPaid, payment_paid_at: nextPaidAt } : row,
      ),
    );
    await supabase
      .from("milestones")
      .update({ payment_paid: nextPaid, payment_paid_at: nextPaidAt })
      .eq("id", m.id);
  }

  async function handleDelete(m: Milestone) {
    setMilestones((prev) => prev.filter((row) => row.id !== m.id));
    await supabase.from("milestones").delete().eq("id", m.id);
  }

  return (
    <div className="border border-hair bg-paper-2">
      <div className="flex items-center justify-between px-4 py-3 border-b border-hair">
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-2">
          Milestone
        </span>
        <span className="font-mono text-[10.5px] text-ink-3">{milestones.length}</span>
      </div>

      <div className="p-4 flex flex-col gap-3 border-b border-hair">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
            <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
              Titolo tappa
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Metà lavori"
              className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra w-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
              Scadenza
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border border-hair bg-paper px-2 py-2 text-sm font-mono outline-none focus:border-terra"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-light cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={isPayment}
            onChange={(e) => setIsPayment(e.target.checked)}
          />
          È legata a una rata di pagamento (visibile al cliente)
        </label>

        {isPayment && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
                Nome rata
              </label>
              <input
                value={paymentLabel}
                onChange={(e) => setPaymentLabel(e.target.value)}
                placeholder="es. Seconda rata"
                className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra w-44"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
                Importo (€)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0"
                className="border border-hair bg-paper px-2 py-2 text-sm font-mono outline-none focus:border-terra w-28"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={saving || !title.trim()}
          className="font-mono text-[10.5px] tracking-[0.12em] uppercase bg-ink text-paper px-4 py-2.5 disabled:opacity-40 w-fit"
        >
          {saving ? "Salvataggio…" : "+ Aggiungi milestone"}
        </button>

        {error && <p className="text-terra-dark text-xs">{error}</p>}
      </div>

      <div className="flex flex-col">
        {milestones.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-3">Nessuna milestone per questo cantiere.</p>
        )}
        {milestones.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 px-4 py-3 border-b border-hair last:border-b-0"
          >
            <button
              onClick={() => toggleCompleted(m)}
              className={`w-4 h-4 rounded-full border shrink-0 ${
                m.completed_at ? "bg-green border-green" : "border-ink-3"
              }`}
              aria-label={m.completed_at ? "Segna come non fatta" : "Segna come fatta"}
            />
            <span className={`flex-1 text-sm ${m.completed_at ? "line-through text-ink-3" : ""}`}>
              {m.title}
            </span>
            {m.due_date && (
              <span className="font-mono text-[10.5px] text-ink-3 shrink-0">
                {formatDateIt(m.due_date)}
              </span>
            )}
            {m.is_payment && (
              <button
                onClick={() => togglePaid(m)}
                className={`font-mono text-[9px] tracking-[0.08em] uppercase px-2 py-1 shrink-0 ${
                  m.payment_paid ? "bg-green/15 text-green" : "bg-terra-soft text-terra-dark"
                }`}
              >
                {m.payment_label}
                {m.payment_amount ? ` · €${m.payment_amount}` : ""} ·{" "}
                {m.payment_paid ? "Pagata" : "Da pagare"}
              </button>
            )}
            <button
              onClick={() => handleDelete(m)}
              className="text-ink-3 hover:text-terra text-xs shrink-0"
              aria-label="Elimina"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
