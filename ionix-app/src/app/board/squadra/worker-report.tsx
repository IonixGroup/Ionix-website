"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  formatDateItShort,
  formatDateIt,
} from "@/lib/format";

type AttendanceRow = {
  id: string;
  work_date: string;
  units: number;
  project_id: string;
  projects: { name: string } | null;
};

type AdvanceRow = {
  id: string;
  advance_date: string;
  amount: number;
  note: string | null;
};

type Period = "week" | "month";

export default function WorkerReport({
  workerId,
  workerName,
  dailyRate,
}: {
  workerId: string;
  workerName: string;
  dailyRate: number | null;
}) {
  const [period, setPeriod] = useState<Period>("week");
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<AttendanceRow[] | null>(null);
  const [advances, setAdvances] = useState<AdvanceRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [savingAdvance, setSavingAdvance] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const start = period === "week" ? startOfWeek(offset) : startOfMonth(offset);
  const end = period === "week" ? endOfWeek(offset) : endOfMonth(offset);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [{ data: attData }, { data: advData }] = await Promise.all([
        supabase
          .from("attendance")
          .select("id, work_date, units, project_id, projects(name)")
          .eq("worker_id", workerId)
          .gte("work_date", start)
          .lte("work_date", end)
          .order("work_date", { ascending: true }),
        supabase
          .from("advances")
          .select("id, advance_date, amount, note")
          .eq("worker_id", workerId)
          .gte("advance_date", start)
          .lte("advance_date", end)
          .order("advance_date", { ascending: true }),
      ]);
      if (!cancelled) {
        setRows((attData as unknown as AttendanceRow[]) ?? []);
        setAdvances((advData as AdvanceRow[]) ?? []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, workerId, start, end]);

  const totalUnits = (rows ?? []).reduce((sum, r) => sum + Number(r.units), 0);
  const grossPay = dailyRate ? totalUnits * dailyRate : null;
  const totalAdvances = (advances ?? []).reduce((sum, a) => sum + Number(a.amount), 0);
  const netPay = grossPay !== null ? grossPay - totalAdvances : null;

  async function handleAddAdvance() {
    const amount = Number(advanceAmount);
    if (!amount || amount <= 0 || !advanceDate) return;
    setSavingAdvance(true);

    const { data, error } = await supabase
      .from("advances")
      .insert({ worker_id: workerId, amount, advance_date: advanceDate })
      .select()
      .single();

    setSavingAdvance(false);
    if (!error && data) {
      setAdvances((prev) => [...(prev ?? []), data]);
      setAdvanceAmount("");
    }
  }

  async function handleRemoveAdvance(a: AdvanceRow) {
    setAdvances((prev) => (prev ?? []).filter((row) => row.id !== a.id));
    await supabase.from("advances").delete().eq("id", a.id);
  }

  async function handleDownloadPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Ionix Group — Estratto presenze", margin, y);
    y += 26;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Lavoratore: ${workerName}`, margin, y);
    y += 16;
    doc.text(
      `Periodo: ${formatDateIt(start)} – ${formatDateIt(end)} (${period === "week" ? "settimana" : "mese"})`,
      margin,
      y,
    );
    y += 26;

    doc.setFont("helvetica", "bold");
    doc.text("Presenze", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    if (!rows || rows.length === 0) {
      doc.text("Nessuna presenza in questo periodo.", margin, y);
      y += 16;
    } else {
      rows.forEach((r) => {
        doc.text(
          `${formatDateItShort(r.work_date)}   ${r.projects?.name ?? "Cantiere"}   ${r.units === 1 ? "giornata intera" : r.units + " giorn."}`,
          margin,
          y,
        );
        y += 15;
      });
    }
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Anticipi", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    if (!advances || advances.length === 0) {
      doc.text("Nessun anticipo in questo periodo.", margin, y);
      y += 16;
    } else {
      advances.forEach((a) => {
        doc.text(
          `${formatDateItShort(a.advance_date)}   €${Number(a.amount).toFixed(2)}${a.note ? "   " + a.note : ""}`,
          margin,
          y,
        );
        y += 15;
      });
    }
    y += 20;

    doc.setDrawColor(200);
    doc.line(margin, y, 547, y);
    y += 22;

    doc.setFontSize(12);
    doc.text(`Totale giornate: ${totalUnits}`, margin, y);
    y += 18;
    doc.text(`Lordo: ${grossPay !== null ? "€" + grossPay.toFixed(2) : "— (paga/giorno non impostata)"}`, margin, y);
    y += 18;
    doc.text(`Anticipi: €${totalAdvances.toFixed(2)}`, margin, y);
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Netto da pagare: ${netPay !== null ? "€" + netPay.toFixed(2) : "—"}`, margin, y);

    doc.save(`${workerName.replace(/\s+/g, "-")}_${start}_${end}.pdf`);
  }

  return (
    <div className="border-t border-hair bg-paper px-4 py-4 text-left">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          <button
            onClick={() => {
              setPeriod("week");
              setOffset(0);
            }}
            className={`font-mono text-[9.5px] uppercase px-2 py-1 ${period === "week" ? "bg-ink text-paper" : "text-ink-3"}`}
          >
            Settimana
          </button>
          <button
            onClick={() => {
              setPeriod("month");
              setOffset(0);
            }}
            className={`font-mono text-[9.5px] uppercase px-2 py-1 ${period === "month" ? "bg-ink text-paper" : "text-ink-3"}`}
          >
            Mese
          </button>
        </div>
        <button
          onClick={handleDownloadPdf}
          className="font-mono text-[9.5px] uppercase text-terra-dark hover:text-terra"
        >
          ⬇ Scarica PDF
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="font-mono text-[10px] text-ink-3 hover:text-terra"
        >
          ← Prec.
        </button>
        <span className="font-mono text-[10px] text-ink-2">
          {formatDateItShort(start)} – {formatDateItShort(end)}
        </span>
        <button
          onClick={() => setOffset((o) => o + 1)}
          disabled={offset >= 0}
          className="font-mono text-[10px] text-ink-3 hover:text-terra disabled:opacity-30"
        >
          Succ. →
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-ink-3">Caricamento…</p>
      ) : (
        <>
          {rows && rows.length > 0 ? (
            <div className="flex flex-col gap-1 mb-3">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <span className="text-ink-2">
                    {formatDateItShort(r.work_date)} · {r.projects?.name ?? "Cantiere"}
                  </span>
                  <span className="font-mono text-ink-3">
                    {r.units === 1 ? "giornata intera" : `${r.units} giorn.`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-3 mb-3">Nessuna presenza in questo periodo.</p>
          )}

          {advances && advances.length > 0 && (
            <div className="flex flex-col gap-1 mb-3 border-t border-hair pt-3">
              {advances.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs">
                  <span className="text-ink-2">
                    {formatDateItShort(a.advance_date)} · Anticipo{a.note ? ` · ${a.note}` : ""}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-terra-dark">
                      −€{Number(a.amount).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemoveAdvance(a)}
                      className="text-ink-3 hover:text-terra"
                      aria-label="Rimuovi anticipo"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 mb-4 border-t border-hair pt-3">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase text-ink-3">Anticipo €</label>
              <input
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="0"
                className="border border-hair bg-paper-2 px-2 py-1.5 text-xs font-mono outline-none focus:border-terra w-20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase text-ink-3">Data</label>
              <input
                type="date"
                value={advanceDate}
                onChange={(e) => setAdvanceDate(e.target.value)}
                className="border border-hair bg-paper-2 px-2 py-1.5 text-xs font-mono outline-none focus:border-terra"
              />
            </div>
            <button
              onClick={handleAddAdvance}
              disabled={savingAdvance}
              className="font-mono text-[9.5px] uppercase bg-paper-4 text-ink-2 px-3 py-1.5 disabled:opacity-40"
            >
              + Registra anticipo
            </button>
          </div>

          <div className="flex flex-col gap-1 border-t border-hair pt-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">
                Lordo · {totalUnits} giorn.
              </span>
              <span className="font-mono text-sm text-ink-2">
                {grossPay !== null ? `€${grossPay.toFixed(2)}` : "—"}
              </span>
            </div>
            {totalAdvances > 0 && (
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">
                  Anticipi
                </span>
                <span className="font-mono text-sm text-terra-dark">
                  −€{totalAdvances.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">
                Netto da pagare
              </span>
              <span className="font-serif text-lg">
                {netPay !== null ? `€${netPay.toFixed(2)}` : "Imposta la paga giornaliera"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
