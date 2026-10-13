"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type Worker = Database["public"]["Tables"]["workers"]["Row"];
type Project = { id: string; name: string };
type Row = {
  id: string;
  worker_id: string;
  project_id: string;
  work_date: string;
  units: number;
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function todayIso() {
  return toIso(new Date());
}

export default function CalendarioClient({
  workers,
  projects,
}: {
  workers: Worker[];
  projects: Project[];
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerId, setWorkerId] = useState(workers[0]?.id ?? "");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [units, setUnits] = useState<"1" | "0.5">("1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const workerById = useMemo(() => new Map(workers.map((w) => [w.id, w])), [workers]);
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const monthStart = toIso(new Date(year, month, 1));
  const monthEnd = toIso(new Date(year, month + 1, 0));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("attendance")
        .select("id, worker_id, project_id, work_date, units")
        .gte("work_date", monthStart)
        .lte("work_date", monthEnd);
      if (!cancelled) {
        setRows((data as Row[]) ?? []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, monthStart, monthEnd]);

  async function handleAdd() {
    if (!workerId || !projectId || !selectedDate) return;
    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("attendance")
      .insert({
        worker_id: workerId,
        project_id: projectId,
        work_date: selectedDate,
        units: Number(units),
      })
      .select()
      .single();

    setSaving(false);

    if (insertError || !data) {
      setError("Salvataggio non riuscito: " + (insertError?.message ?? ""));
      return;
    }

    setRows((prev) => [...prev, data]);
  }

  async function handleRemove(row: Row) {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    await supabase.from("attendance").delete().eq("id", row.id);
  }

  function changeMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  // Griglia: lunedì come primo giorno.
  const firstOfMonth = new Date(year, month, 1);
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toIso(new Date(year, month, i + 1))),
  ];

  const rowsByDate = useMemo(() => {
    const map = new Map<string, Row[]>();
    rows.forEach((r) => {
      const list = map.get(r.work_date) ?? [];
      list.push(r);
      map.set(r.work_date, list);
    });
    return map;
  }, [rows]);

  const selectedRows = rowsByDate.get(selectedDate) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-3 hover:text-terra"
        >
          ← Mese prec.
        </button>
        <span className="font-serif text-lg">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-3 hover:text-terra"
        >
          Mese succ. →
        </button>
      </div>

      <div className="grid grid-cols-7 border-t border-l border-hair mb-8">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3 text-center py-2 border-r border-b border-hair bg-paper-2"
          >
            {w}
          </div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) {
            return <div key={i} className="border-r border-b border-hair bg-paper min-h-[86px]" />;
          }
          const dayRows = rowsByDate.get(iso) ?? [];
          const isSelected = iso === selectedDate;
          const isToday = iso === todayIso();
          return (
            <button
              key={iso}
              onClick={() => setSelectedDate(iso)}
              className={`text-left border-r border-b border-hair min-h-[86px] p-1.5 flex flex-col gap-1 ${
                isSelected ? "bg-terra-soft" : "bg-paper hover:bg-paper-2"
              }`}
            >
              <span
                className={`font-mono text-[10.5px] ${
                  isToday ? "text-terra font-medium" : "text-ink-3"
                }`}
              >
                {Number(iso.slice(8, 10))}
              </span>
              <div className="flex flex-col gap-0.5">
                {dayRows.slice(0, 3).map((r) => (
                  <span
                    key={r.id}
                    className="font-mono text-[9px] bg-paper-4 text-ink-2 px-1 py-0.5 truncate"
                  >
                    {workerById.get(r.worker_id)?.full_name.split(" ")[0] ?? "—"}
                  </span>
                ))}
                {dayRows.length > 3 && (
                  <span className="font-mono text-[9px] text-ink-3">+{dayRows.length - 3}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="border border-hair bg-paper-2 p-4">
        <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-2 mb-3">
          {new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" }).format(
            new Date(`${selectedDate}T00:00:00`),
          )}
        </div>

        {selectedRows.length > 0 && (
          <div className="flex flex-col gap-1 mb-4">
            {selectedRows.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span>
                  {workerById.get(r.worker_id)?.full_name ?? "—"} ·{" "}
                  <span className="text-ink-3 font-mono text-[10.5px]">
                    {projectById.get(r.project_id)?.name ?? "—"}
                  </span>
                  {r.units !== 1 && (
                    <span className="text-ink-3 font-mono text-[10.5px]"> · {r.units}g</span>
                  )}
                </span>
                <button
                  onClick={() => handleRemove(r)}
                  className="text-ink-3 hover:text-terra text-xs"
                  aria-label="Rimuovi"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
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
              Cantiere
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="border border-hair bg-paper px-2 py-2 text-sm font-mono outline-none focus:border-terra"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
              Giornata
            </label>
            <select
              value={units}
              onChange={(e) => setUnits(e.target.value as "1" | "0.5")}
              className="border border-hair bg-paper px-2 py-2 text-sm font-mono outline-none focus:border-terra"
            >
              <option value="1">Intera</option>
              <option value="0.5">Mezza</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="font-mono text-[10.5px] tracking-[0.12em] uppercase bg-ink text-paper px-4 py-2.5 disabled:opacity-40"
          >
            {saving ? "Salvataggio…" : "+ Aggiungi"}
          </button>
        </div>

        {error && <p className="text-terra-dark text-xs mt-3">{error}</p>}
        {loading && <p className="text-ink-3 text-xs mt-3">Caricamento mese…</p>}
      </div>
    </div>
  );
}
