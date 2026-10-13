"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type Professional = Database["public"]["Tables"]["professionals"]["Row"];
type TeamRow = Database["public"]["Tables"]["project_team"]["Row"];

export default function ProjectTeamClient({
  projectId,
  professionals,
  initialTeam,
}: {
  projectId: string;
  professionals: Professional[];
  initialTeam: TeamRow[];
}) {
  const [team, setTeam] = useState(initialTeam);
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id ?? "");
  const [roleLabel, setRoleLabel] = useState(professionals[0]?.title ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const professionalById = useMemo(
    () => new Map(professionals.map((p) => [p.id, p])),
    [professionals],
  );

  function handleProfessionalChange(id: string) {
    setProfessionalId(id);
    setRoleLabel(professionalById.get(id)?.title ?? "");
  }

  async function handleAdd() {
    if (!professionalId || !roleLabel.trim()) return;
    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("project_team")
      .insert({ project_id: projectId, professional_id: professionalId, role_label: roleLabel.trim() })
      .select()
      .single();

    setSaving(false);

    if (insertError || !data) {
      setError("Salvataggio non riuscito: " + (insertError?.message ?? ""));
      return;
    }

    setTeam((prev) => [...prev, data]);
  }

  async function handleRemove(row: TeamRow) {
    setTeam((prev) => prev.filter((r) => r.id !== row.id));
    await supabase.from("project_team").delete().eq("id", row.id);
  }

  return (
    <div className="border border-hair bg-paper-2">
      <div className="flex items-center justify-between px-4 py-3 border-b border-hair">
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-2">
          Squadra assegnata · visibile al cliente
        </span>
        <span className="font-mono text-[10.5px] text-ink-3">{team.length}</span>
      </div>

      {professionals.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-3">
          Nessun professionista in albo — aggiungili dalla pagina Professionisti.
        </p>
      ) : (
        <>
          <div className="p-4 flex flex-wrap items-end gap-3 border-b border-hair">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
                Professionista
              </label>
              <select
                value={professionalId}
                onChange={(e) => handleProfessionalChange(e.target.value)}
                className="border border-hair bg-paper px-2 py-2 text-sm font-mono outline-none focus:border-terra"
              >
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} · {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
                Ruolo su questo cantiere
              </label>
              <input
                value={roleLabel}
                onChange={(e) => setRoleLabel(e.target.value)}
                placeholder="es. Capo cantiere"
                className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra w-52"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="font-mono text-[10.5px] tracking-[0.12em] uppercase bg-ink text-paper px-4 py-2.5 disabled:opacity-40"
            >
              {saving ? "Salvataggio…" : "+ Assegna"}
            </button>
          </div>

          {error && <p className="px-4 pt-3 text-terra-dark text-xs">{error}</p>}

          <div className="flex flex-col">
            {team.length === 0 && (
              <p className="px-4 py-6 text-sm text-ink-3">Nessun professionista assegnato.</p>
            )}
            {team.map((row) => {
              const p = professionalById.get(row.professional_id);
              return (
                <div
                  key={row.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-hair last:border-b-0"
                >
                  <span className="flex-1 text-sm">{p?.full_name ?? "—"}</span>
                  <span className="font-mono text-[10.5px] text-terra-dark shrink-0">
                    {row.role_label}
                  </span>
                  <button
                    onClick={() => handleRemove(row)}
                    className="text-ink-3 hover:text-terra text-xs shrink-0"
                    aria-label="Rimuovi"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
