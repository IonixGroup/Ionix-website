"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { formatDateIt } from "@/lib/format";

type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
type Worker = Database["public"]["Tables"]["workers"]["Row"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendanceClient({
  projectId,
  workers,
  initialAttendance,
}: {
  projectId: string;
  workers: Worker[];
  initialAttendance: Attendance[];
}) {
  const [rows, setRows] = useState(initialAttendance);
  const [workerId, setWorkerId] = useState(workers[0]?.id ?? "");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const workerById = useMemo(() => new Map(workers.map((w) => [w.id, w])), [workers]);

  const totalsByWorker = useMemo(() => {
    const totals = new Map<string, number>();
    rows.forEach((r) => totals.set(r.worker_id, (totals.get(r.worker_id) ?? 0) + 1));
    return totals;
  }, [rows]);

  async function handleAdd() {
    if (!workerId || !date) return;
    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("attendance")
      .insert({ project_id: projectId, worker_id: workerId, work_date: date, note: note.trim() || null })
      .select()
      .single();

    setSaving(false);

    if (insertError || !data) {
      setError("Salvataggio non riuscito: " + (insertError?.message ?? ""));
      return;
    }

    setRows((prev) => [data, ...prev]);
    setNote("");
  }

  async function handleDelete(row: Attendance) {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    await supabase.from("attendance").delete().eq("id", row.id);
  }

  return (
    <div className="border border-hair bg-paper-2">
      <div className="flex items-center justify-between px-4 py-3 border-b border-hair">
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-2">
          Presenze
        </span>
        <span className="font-mono text-[10.5px] text-ink-3">{rows.length}</span>
      </div>

      {workers.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-3">
          Nessun lavoratore in squadra — aggiungili dalla pagina Squadra.
        </p>
      ) : (
        <>
          <div className="p-4 flex flex-wrap items-end gap-3 border-b border-hair">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
                Lavoratore
              </label>
              <select
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className="border border-hair bg-paper px-2 py-2 text-sm font-mono outline-none focus:border-terra"
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
                Giorno
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-hair bg-paper px-2 py-2 text-sm font-mono outline-none focus:border-terra"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
              <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
                Nota (opzionale)
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="es. mezza giornata"
                className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra w-full"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="font-mono text-[10.5px] tracking-[0.12em] uppercase bg-ink text-paper px-4 py-2.5 disabled:opacity-40"
            >
              {saving ? "Salvataggio…" : "Aggiungi"}
            </button>
          </div>

          {error && <p className="px-4 pt-3 text-terra-dark text-xs">{error}</p>}

          {totalsByWorker.size > 0 && (
            <div className="px-4 py-3 border-b border-hair flex flex-wrap gap-x-5 gap-y-1">
              {Array.from(totalsByWorker.entries()).map(([wid, count]) => (
                <span key={wid} className="font-mono text-[10.5px] text-ink-2">
                  {workerById.get(wid)?.full_name ?? "—"}:{" "}
                  <span className="text-ink">{count} giorn{count === 1 ? "o" : "i"}</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col">
            {rows.length === 0 && (
              <p className="px-4 py-6 text-sm text-ink-3">Nessuna presenza registrata.</p>
            )}
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-hair last:border-b-0"
              >
                <span className="text-sm flex-1">
                  {workerById.get(row.worker_id)?.full_name ?? "—"}
                </span>
                <span className="font-mono text-[10.5px] text-ink-3 shrink-0">
                  {formatDateIt(row.work_date)}
                </span>
                {row.note && (
                  <span className="text-xs text-ink-2 shrink-0 max-w-[160px] truncate">
                    {row.note}
                  </span>
                )}
                <button
                  onClick={() => handleDelete(row)}
                  className="text-ink-3 hover:text-terra text-xs shrink-0"
                  aria-label="Elimina"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
