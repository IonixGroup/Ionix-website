"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { startOfWeek, endOfWeek, formatDateItShort } from "@/lib/format";

type Row = {
  id: string;
  work_date: string;
  units: number;
  project_id: string;
  projects: { name: string } | null;
};

export default function WorkerReport({
  workerId,
  dailyRate,
}: {
  workerId: string;
  dailyRate: number | null;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const start = startOfWeek(weekOffset);
  const end = endOfWeek(weekOffset);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("attendance")
        .select("id, work_date, units, project_id, projects(name)")
        .eq("worker_id", workerId)
        .gte("work_date", start)
        .lte("work_date", end)
        .order("work_date", { ascending: true });
      if (!cancelled) {
        setRows((data as unknown as Row[]) ?? []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, workerId, start, end]);

  const totalUnits = (rows ?? []).reduce((sum, r) => sum + Number(r.units), 0);
  const totalPay = dailyRate ? totalUnits * dailyRate : null;

  return (
    <div className="border-t border-hair bg-paper px-4 py-4 text-left">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="font-mono text-[10px] text-ink-3 hover:text-terra"
        >
          ← Settimana prec.
        </button>
        <span className="font-mono text-[10px] text-ink-2">
          {formatDateItShort(start)} – {formatDateItShort(end)}
        </span>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          disabled={weekOffset >= 0}
          className="font-mono text-[10px] text-ink-3 hover:text-terra disabled:opacity-30"
        >
          Settimana succ. →
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-ink-3">Caricamento…</p>
      ) : rows && rows.length > 0 ? (
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
        <p className="text-xs text-ink-3 mb-3">Nessuna presenza in questa settimana.</p>
      )}

      <div className="flex items-center justify-between border-t border-hair pt-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">
          Totale: {totalUnits} giorn.
        </span>
        <span className="font-serif text-lg">
          {totalPay !== null ? `€${totalPay.toFixed(2)}` : "Imposta la paga giornaliera"}
        </span>
      </div>
    </div>
  );
}
