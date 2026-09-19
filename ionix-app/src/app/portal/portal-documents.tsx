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

export default function PortalDocuments({ documents }: { documents: Doc[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(null);

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

  if (documents.length === 0) {
    return <p className="text-sm text-ink-3">Nessun documento disponibile ancora.</p>;
  }

  return (
    <div className="border border-hair bg-paper-2">
      {documents.map((doc) => (
        <button
          key={doc.id}
          onClick={() => handleDownload(doc)}
          className="w-full flex items-center gap-3 px-4 py-3 border-b border-hair last:border-b-0 text-left hover:bg-paper"
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
          <span className="flex-1 text-sm">{doc.title}</span>
          <span className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-ink-3">
            {CATEGORY_LABEL[doc.category]}
          </span>
        </button>
      ))}
      {error && <p className="text-terra-dark text-xs px-4 py-2">{error}</p>}
    </div>
  );
}
