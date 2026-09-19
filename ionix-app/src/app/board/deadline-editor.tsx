"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateIt } from "@/lib/format";

export default function DeadlineEditor({
  projectId,
  initialDeadline,
}: {
  projectId: string;
  initialDeadline: string | null;
}) {
  const [deadline, setDeadline] = useState(initialDeadline);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(value: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .update({ deadline: value || null })
      .eq("id", projectId);
    setSaving(false);
    if (!error) {
      setDeadline(value || null);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="date"
          autoFocus
          defaultValue={deadline ?? ""}
          disabled={saving}
          onBlur={(e) => save(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save((e.target as HTMLInputElement).value);
            if (e.key === "Escape") setEditing(false);
          }}
          className="border border-hair bg-paper px-2 py-1 text-sm font-mono outline-none focus:border-terra"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-2 text-left group"
    >
      <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-2">
        Consegna
      </span>
      <span className="font-serif text-base group-hover:text-terra-dark">
        {deadline ? formatDateIt(deadline) : "— da impostare"}
      </span>
    </button>
  );
}
