"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type Professional = Database["public"]["Tables"]["professionals"]["Row"];

const TITLE_SUGGESTIONS = [
  "Architetto",
  "Geometra",
  "Ingegnere",
  "Capo cantiere",
  "Responsabile del progetto",
];

export default function ProfessionistiClient({
  initialProfessionals,
  initialPhotoUrls,
}: {
  initialProfessionals: Professional[];
  initialPhotoUrls: Record<string, string>;
}) {
  const [list, setList] = useState(initialProfessionals);
  const [photoUrls, setPhotoUrls] = useState(initialPhotoUrls);
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("Architetto");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  async function handleAdd() {
    if (!fullName.trim() || !title.trim()) return;
    setSaving(true);
    setError(null);

    let photoPath: string | null = null;
    if (photoFile) {
      photoPath = `${crypto.randomUUID()}-${photoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("professionals")
        .upload(photoPath, photoFile);
      if (uploadError) {
        setSaving(false);
        setError("Caricamento foto non riuscito: " + uploadError.message);
        return;
      }
    }

    const { data, error: insertError } = await supabase
      .from("professionals")
      .insert({
        full_name: fullName.trim(),
        title: title.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        bio: bio.trim() || null,
        photo_path: photoPath,
      })
      .select()
      .single();

    setSaving(false);

    if (insertError || !data) {
      if (photoPath) await supabase.storage.from("professionals").remove([photoPath]);
      setError("Salvataggio non riuscito: " + (insertError?.message ?? ""));
      return;
    }

    if (photoPath) {
      const { data: signed } = await supabase.storage
        .from("professionals")
        .createSignedUrl(photoPath, 3600);
      if (signed) setPhotoUrls((prev) => ({ ...prev, [photoPath as string]: signed.signedUrl }));
    }

    setList((prev) => [data, ...prev]);
    setFullName("");
    setTitle("Architetto");
    setPhone("");
    setEmail("");
    setBio("");
    setPhotoFile(null);
  }

  async function toggleActive(p: Professional, e: React.MouseEvent) {
    e.stopPropagation();
    const next = !p.active;
    setList((prev) => prev.map((row) => (row.id === p.id ? { ...row, active: next } : row)));
    await supabase.from("professionals").update({ active: next }).eq("id", p.id);
  }

  async function handleDelete(p: Professional, e: React.MouseEvent) {
    e.stopPropagation();
    setList((prev) => prev.filter((row) => row.id !== p.id));
    if (p.photo_path) await supabase.storage.from("professionals").remove([p.photo_path]);
    await supabase.from("professionals").delete().eq("id", p.id);
  }

  return (
    <div>
      <div className="border border-hair bg-paper-2 p-4 mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
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
              Titolo
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              list="title-suggestions"
              className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra w-44"
            />
            <datalist id="title-suggestions">
              {TITLE_SUGGESTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
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
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Opzionale"
              className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra w-48"
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
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
            Breve biografia (visibile al cliente)
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            placeholder="es. 15 anni di esperienza in ristrutturazioni residenziali a Roma."
            className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra resize-none"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={saving || !fullName.trim()}
          className="font-mono text-[10.5px] tracking-[0.12em] uppercase bg-ink text-paper px-4 py-2.5 disabled:opacity-40 w-fit"
        >
          {saving ? "Salvataggio…" : "Aggiungi"}
        </button>
      </div>

      {error && <p className="text-terra-dark text-xs mb-4">{error}</p>}

      {list.length === 0 ? (
        <p className="text-ink-2 text-sm">Nessun professionista registrato.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 items-start">
          {list.map((p) => {
            const expanded = expandedId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setExpandedId(expanded ? null : p.id)}
                className={`border border-hair bg-paper-2 cursor-pointer ${
                  !p.active ? "opacity-50" : ""
                } ${expanded ? "col-span-2" : ""}`}
              >
                <div className="p-4 flex flex-col items-center text-center">
                  {p.photo_path && photoUrls[p.photo_path] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={photoUrls[p.photo_path]}
                      alt={p.full_name}
                      className="w-20 h-20 rounded-full object-cover mb-3"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-paper-4 flex items-center justify-center mb-3 font-serif text-xl text-ink-3">
                      {p.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-sm font-medium mb-1">{p.full_name}</div>
                  <div className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-terra-dark mb-3">
                    {p.title}
                  </div>

                  {expanded && (
                    <div
                      className="text-left w-full border-t border-hair pt-3 flex flex-col gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.bio && <p className="text-xs text-ink-2 leading-relaxed">{p.bio}</p>}
                      {p.phone && <p className="font-mono text-[10.5px] text-ink-3">{p.phone}</p>}
                      {p.email && <p className="font-mono text-[10.5px] text-ink-3">{p.email}</p>}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-3 pt-2">
                    <button
                      onClick={(e) => toggleActive(p, e)}
                      className="font-mono text-[9px] tracking-[0.08em] uppercase text-ink-3 hover:text-terra"
                    >
                      {p.active ? "Disattiva" : "Riattiva"}
                    </button>
                    <button
                      onClick={(e) => handleDelete(p, e)}
                      className="font-mono text-[9px] tracking-[0.08em] uppercase text-ink-3 hover:text-terra"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
