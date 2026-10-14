"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export default function ProjectManagerClient({
  projects,
  activeProjectId,
}: {
  projects: Project[];
  activeProjectId?: string;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({
        name: name.trim(),
        address: address.trim() || null,
        deadline: deadline || null,
      })
      .select()
      .single();

    setSaving(false);

    if (insertError || !data) {
      setError("Creazione non riuscita: " + (insertError?.message ?? ""));
      return;
    }

    setName("");
    setAddress("");
    setDeadline("");
    setAdding(false);
    router.push(`/board?project=${data.id}`);
    router.refresh();
  }

  async function handleDelete(project: Project) {
    if (
      !confirm(
        `Eliminare "${project.name}"? Verranno cancellati anche task, documenti, foto, milestone e presenze collegate a questo cantiere. Non si può annullare.`,
      )
    )
      return;

    await supabase.from("projects").delete().eq("id", project.id);

    const remaining = projects.filter((p) => p.id !== project.id);
    router.push(remaining[0] ? `/board?project=${remaining[0].id}` : "/board");
    router.refresh();
  }

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {projects.map((p) => (
          <div key={p.id} className="flex items-center">
            <Link
              href={`/board?project=${p.id}`}
              className={`font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-2 border ${
                p.id === activeProjectId
                  ? "bg-ink text-paper border-ink"
                  : "border-hair text-ink-2 hover:text-ink"
              }`}
            >
              {p.name}
            </Link>
            {p.id === activeProjectId && (
              <button
                onClick={() => handleDelete(p)}
                className="font-mono text-[10px] text-ink-3 hover:text-terra px-2 py-2 border border-l-0 border-hair"
                aria-label={`Elimina ${p.name}`}
                title="Elimina questo cantiere"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setAdding((v) => !v)}
          className="font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-2 border border-dashed border-hair text-ink-3 hover:text-terra hover:border-terra"
        >
          + Nuovo cantiere
        </button>
      </div>

      {adding && (
        <div className="border border-hair bg-paper-2 p-4 flex flex-wrap items-end gap-3 mb-2">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
              Nome cantiere
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Bilocale — Via Tiburtina"
              className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra w-56"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
              Indirizzo
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Opzionale"
              className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra w-56"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
              Consegna
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="border border-hair bg-paper px-2 py-2 text-sm font-mono outline-none focus:border-terra"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="font-mono text-[10.5px] tracking-[0.12em] uppercase bg-ink text-paper px-4 py-2.5 disabled:opacity-40"
          >
            {saving ? "Creazione…" : "Crea cantiere"}
          </button>
          {error && <p className="text-terra-dark text-xs w-full">{error}</p>}
        </div>
      )}
    </div>
  );
}
