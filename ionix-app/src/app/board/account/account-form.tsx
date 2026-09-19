"use client";

import { useState } from "react";
import { createAccount } from "./actions";
import type { ProfileRole } from "@/lib/database.types";

type Project = { id: string; name: string };

export default function AccountForm({ projects }: { projects: Project[] }) {
  const [role, setRole] = useState<ProfileRole>("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCreated(null);

    const formData = new FormData(e.currentTarget);
    const result = await createAccount(formData);

    setLoading(false);

    if ("error" in result) {
      setError(result.error ?? "Errore imprevisto.");
      return;
    }

    setCreated(result);
    e.currentTarget.reset();
    setRole("client");
  }

  if (created) {
    return (
      <div className="bg-terra-soft px-6 py-6">
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-terra-dark mb-3">
          Account creato — comunica queste credenziali una sola volta
        </div>
        <div className="flex flex-col gap-1 mb-4 font-mono text-sm">
          <span>Email: {created.email}</span>
          <span>Password: {created.password}</span>
        </div>
        <button
          onClick={() => setCreated(null)}
          className="font-mono text-[10px] tracking-[0.14em] uppercase text-terra-dark underline"
        >
          Crea un altro account
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1 bg-hair">
      <div className="bg-paper p-4 flex flex-col gap-2">
        <label className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3">
          Tipo di account
        </label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as ProfileRole)}
          className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra w-fit"
        >
          <option value="client">Cliente</option>
          <option value="team">Squadra</option>
        </select>
      </div>

      {role === "client" && (
        <div className="bg-paper p-4 flex flex-col gap-2">
          <label className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3">
            Progetto del cliente
          </label>
          <select
            name="project_id"
            required
            className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra w-fit"
          >
            <option value="">Seleziona…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-paper p-4 flex flex-col gap-2">
        <label className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3">
          Nome e cognome
        </label>
        <input
          name="full_name"
          type="text"
          className="border border-hair bg-paper px-3 py-2 text-sm outline-none focus:border-terra"
          placeholder="Mario Rossi"
        />
      </div>

      <div className="bg-paper p-4 flex flex-col gap-2">
        <label className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          className="border border-hair bg-paper px-3 py-2 text-sm outline-none focus:border-terra"
          placeholder="nome@email.it"
        />
      </div>

      {error && <p className="bg-paper px-4 py-3 text-terra-dark text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-ink text-paper py-4 font-mono text-[11px] tracking-[0.16em] uppercase disabled:opacity-60"
      >
        {loading ? "Creazione…" : "Crea account"}
      </button>
    </form>
  );
}
