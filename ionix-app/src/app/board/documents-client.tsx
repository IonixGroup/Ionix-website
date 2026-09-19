"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database, DocumentCategory } from "@/lib/database.types";

type Doc = Database["public"]["Tables"]["documents"]["Row"];

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  contratto: "Contratto",
  preventivo: "Preventivo",
  altro: "Altro",
};

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsClient({
  projectId,
  initialDocuments,
}: {
  projectId: string;
  initialDocuments: Doc[];
}) {
  const [docs, setDocs] = useState(initialDocuments);
  const [category, setCategory] = useState<DocumentCategory>("altro");
  const [clientVisible, setClientVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);

    const path = `${projectId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);

    if (uploadError) {
      setUploading(false);
      setError("Caricamento non riuscito: " + uploadError.message);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("documents")
      .insert({
        project_id: projectId,
        title: file.name,
        category,
        client_visible: clientVisible,
        file_path: path,
        size_bytes: file.size,
      })
      .select()
      .single();

    setUploading(false);

    if (insertError || !data) {
      await supabase.storage.from("documents").remove([path]);
      setError("Salvataggio non riuscito: " + (insertError?.message ?? ""));
      return;
    }

    setDocs((prev) => [data, ...prev]);
  }

  async function handleDownload(doc: Doc) {
    const { data, error: signError } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60);
    if (signError || !data) {
      setError("Impossibile aprire il file.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleDelete(doc: Doc) {
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    await supabase.storage.from("documents").remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
  }

  async function toggleClientVisible(doc: Doc) {
    const next = !doc.client_visible;
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, client_visible: next } : d)));
    await supabase.from("documents").update({ client_visible: next }).eq("id", doc.id);
  }

  return (
    <div className="border border-hair bg-paper-2">
      <div className="flex items-center justify-between px-4 py-3 border-b border-hair">
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-2">
          Documenti
        </span>
        <span className="font-mono text-[10.5px] text-ink-3">{docs.length}</span>
      </div>

      <div className="p-4 flex flex-col gap-3 border-b border-hair">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className="border border-hair bg-paper px-2 py-2 text-sm font-mono outline-none focus:border-terra"
          >
            <option value="contratto">Contratto</option>
            <option value="preventivo">Preventivo</option>
            <option value="altro">Altro</option>
          </select>

          <label className="flex items-center gap-2 text-sm font-light cursor-pointer">
            <input
              type="checkbox"
              checked={clientVisible}
              onChange={(e) => setClientVisible(e.target.checked)}
            />
            Visibile al cliente
          </label>
        </div>

        <label className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-ink-3 hover:text-terra cursor-pointer w-fit">
          {uploading ? "Caricamento…" : "+ Carica PDF"}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </label>

        {error && <p className="text-terra-dark text-xs">{error}</p>}
      </div>

      <div className="flex flex-col">
        {docs.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-3">Nessun documento caricato.</p>
        )}
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-3 px-4 py-3 border-b border-hair last:border-b-0"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="shrink-0 text-ink-2"
            >
              <path d="M7 3h7l4 4v14H7z" />
              <path d="M14 3v4h4" />
            </svg>

            <button
              onClick={() => handleDownload(doc)}
              className="flex-1 text-left text-sm hover:text-terra-dark truncate"
            >
              {doc.title}
            </button>

            <span className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-ink-3 shrink-0">
              {CATEGORY_LABEL[doc.category]}
            </span>

            <button
              onClick={() => toggleClientVisible(doc)}
              className={`font-mono text-[9px] tracking-[0.08em] uppercase px-2 py-1 shrink-0 ${
                doc.client_visible
                  ? "bg-terra-soft text-terra-dark"
                  : "bg-paper-4 text-ink-3"
              }`}
            >
              {doc.client_visible ? "Visibile al cliente" : "Solo squadra"}
            </button>

            <span className="font-mono text-[9.5px] text-ink-3 shrink-0 w-12 text-right">
              {formatSize(doc.size_bytes)}
            </span>

            <button
              onClick={() => handleDelete(doc)}
              className="text-ink-3 hover:text-terra text-xs shrink-0"
              aria-label="Elimina"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
