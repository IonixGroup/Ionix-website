"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database, WorkerTier } from "@/lib/database.types";
import WorkerReport from "./worker-report";

type Worker = Database["public"]["Tables"]["workers"]["Row"];

const TIER_LABEL: Record<WorkerTier, string> = { junior: "Junior", pro: "Pro" };

export default function SquadraClient({
  initialWorkers,
  initialPhotoUrls,
}: {
  initialWorkers: Worker[];
  initialPhotoUrls: Record<string, string>;
}) {
  const [workers, setWorkers] = useState(initialWorkers);
  const [photoUrls, setPhotoUrls] = useState(initialPhotoUrls);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState<WorkerTier>("junior");
  const [dailyRate, setDailyRate] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  async function handleAdd() {
    if (!fullName.trim()) return;
    setSaving(true);
    setError(null);

    let photoPath: string | null = null;
    if (photoFile) {
      photoPath = `${crypto.randomUUID()}-${photoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("workers")
        .upload(photoPath, photoFile);
      if (uploadError) {
        setSaving(false);
        setError("Caricamento foto non riuscito: " + uploadError.message);
        return;
      }
    }

    const { data, error: insertError } = await supabase
      .from("workers")
      .insert({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        photo_path: photoPath,
        tier,
        daily_rate: dailyRate ? Number(dailyRate) : null,
      })
      .select()
      .single();

    setSaving(false);

    if (insertError || !data) {
      if (photoPath) await supabase.storage.from("workers").remove([photoPath]);
      setError("Salvataggio non riuscito: " + (insertError?.message ?? ""));
      return;
    }

    if (photoPath) {
      const { data: signed } = await supabase.storage
        .from("workers")
        .createSignedUrl(photoPath, 3600);
      if (signed) setPhotoUrls((prev) => ({ ...prev, [photoPath as string]: signed.signedUrl }));
    }

    setWorkers((prev) => [data, ...prev]);
    setFullName("");
    setPhone("");
    setTier("junior");
    setDailyRate("");
    setPhotoFile(null);
  }

  async function toggleActive(worker: Worker, e: React.MouseEvent) {
    e.stopPropagation();
    const next = !worker.active;
    setWorkers((prev) => prev.map((w) => (w.id === worker.id ? { ...w, active: next } : w)));
    await supabase.from("workers").update({ active: next }).eq("id", worker.id);
  }

  async function handleDelete(worker: Worker, e: React.MouseEvent) {
    e.stopPropagation();
    setWorkers((prev) => prev.filter((w) => w.id !== worker.id));
    if (worker.photo_path) await supabase.storage.from("workers").remove([worker.photo_path]);
    await supabase.from("workers").delete().eq("id", worker.id);
  }

  async function updateRate(worker: Worker, value: string, e: React.SyntheticEvent) {
    e.stopPropagation();
    const rate = value ? Number(value) : null;
    setWorkers((prev) => prev.map((w) => (w.id === worker.id ? { ...w, daily_rate: rate } : w)));
    await supabase.from("workers").update({ daily_rate: rate }).eq("id", worker.id);
  }

  return (
    <div>
      <div className="border border-hair bg-paper-2 p-4 mb-8 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
            Nome
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nome e cognome"
            className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra w-48"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
            Telefono
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Opzionale"
            className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
            Fascia
          </label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as WorkerTier)}
            className="border border-hair bg-paper px-2 py-2 text-sm font-mono outline-none focus:border-terra"
          >
            <option value="junior">Junior</option>
            <option value="pro">Pro</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
            Paga/giorno (€)
          </label>
          <input
            type="number"
            value={dailyRate}
            onChange={(e) => setDailyRate(e.target.value)}
            placeholder="0"
            className="border border-hair bg-paper px-2 py-2 text-sm font-mono outline-none focus:border-terra w-28"
          />
        </div>
        <label className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-ink-3 hover:text-terra cursor-pointer">
          {photoFile ? photoFile.name : "+ Foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          onClick={handleAdd}
          disabled={saving || !fullName.trim()}
          className="font-mono text-[10.5px] tracking-[0.12em] uppercase bg-ink text-paper px-4 py-2.5 disabled:opacity-40"
        >
          {saving ? "Salvataggio…" : "Aggiungi"}
        </button>
      </div>

      {error && <p className="text-terra-dark text-xs mb-4">{error}</p>}

      {workers.length === 0 ? (
        <p className="text-ink-2 text-sm">Nessun lavoratore registrato.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 items-start">
          {workers.map((worker) => {
            const expanded = expandedId === worker.id;
            return (
              <div
                key={worker.id}
                onClick={() => setExpandedId(expanded ? null : worker.id)}
                className={`border border-hair bg-paper-2 cursor-pointer ${
                  !worker.active ? "opacity-50" : ""
                } ${expanded ? "col-span-2" : ""}`}
              >
                <div className="p-4 flex flex-col items-center text-center">
                  {worker.photo_path && photoUrls[worker.photo_path] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={photoUrls[worker.photo_path]}
                      alt={worker.full_name}
                      className="w-20 h-20 rounded-full object-cover mb-3"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-paper-4 flex items-center justify-center mb-3 font-serif text-xl text-ink-3">
                      {worker.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-sm font-medium mb-1">{worker.full_name}</div>
                  {worker.phone && (
                    <div className="font-mono text-[10.5px] text-ink-3 mb-2">{worker.phone}</div>
                  )}
                  <span
                    className={`font-mono text-[9px] tracking-[0.08em] uppercase px-2 py-1 mb-3 ${
                      worker.tier === "pro" ? "bg-terra-soft text-terra-dark" : "bg-paper-4 text-ink-3"
                    }`}
                  >
                    {TIER_LABEL[worker.tier]}
                  </span>

                  <div
                    className="flex items-center gap-1 mb-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="font-mono text-[10px] text-ink-3">€</span>
                    <input
                      type="number"
                      defaultValue={worker.daily_rate ?? ""}
                      onBlur={(e) => updateRate(worker, e.target.value, e)}
                      placeholder="paga/giorno"
                      className="border border-hair bg-paper px-2 py-1 text-xs font-mono outline-none focus:border-terra w-24 text-center"
                    />
                  </div>

                  <div className="flex items-center gap-3 mt-auto pt-2">
                    <button
                      onClick={(e) => toggleActive(worker, e)}
                      className="font-mono text-[9px] tracking-[0.08em] uppercase text-ink-3 hover:text-terra"
                    >
                      {worker.active ? "Disattiva" : "Riattiva"}
                    </button>
                    <button
                      onClick={(e) => handleDelete(worker, e)}
                      className="font-mono text-[9px] tracking-[0.08em] uppercase text-ink-3 hover:text-terra"
                    >
                      Elimina
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <WorkerReport workerId={worker.id} dailyRate={worker.daily_rate} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
