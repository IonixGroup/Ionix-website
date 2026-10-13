"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type Photo = Database["public"]["Tables"]["photos"]["Row"];

export default function PhotosClient({
  projectId,
  initialPhotos,
  initialUrls,
}: {
  projectId: string;
  initialPhotos: Photo[];
  initialUrls: Record<string, string>;
}) {
  const portalUrl =
    typeof window !== "undefined" ? `${window.location.origin}/portal` : "/portal";
  const [photos, setPhotos] = useState(initialPhotos);
  const [urls, setUrls] = useState(initialUrls);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);

    const path = `${projectId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("photos").upload(path, file);

    if (uploadError) {
      setUploading(false);
      setError("Caricamento non riuscito: " + uploadError.message);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("photos")
      .insert({ project_id: projectId, file_path: path, caption: caption.trim() || null })
      .select()
      .single();

    if (insertError || !data) {
      setUploading(false);
      await supabase.storage.from("photos").remove([path]);
      setError("Salvataggio non riuscito: " + (insertError?.message ?? ""));
      return;
    }

    const { data: signed } = await supabase.storage.from("photos").createSignedUrl(path, 3600);
    if (signed) setUrls((prev) => ({ ...prev, [path]: signed.signedUrl }));

    setUploading(false);
    setPhotos((prev) => [data, ...prev]);
    setCaption("");
  }

  async function handleDelete(photo: Photo) {
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    await supabase.storage.from("photos").remove([photo.file_path]);
    await supabase.from("photos").delete().eq("id", photo.id);
  }

  return (
    <div className="border border-hair bg-paper-2">
      <div className="flex items-center justify-between px-4 py-3 border-b border-hair">
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-2">
          Foto cantiere · visibili al cliente
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10.5px] text-ink-3">{photos.length}</span>
          <button
            onClick={() => setShowQr((v) => !v)}
            className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-ink-3 hover:text-terra"
          >
            {showQr ? "Nascondi QR" : "Mostra QR"}
          </button>
        </div>
      </div>

      {showQr && (
        <div className="p-4 border-b border-hair flex items-center gap-4 bg-paper">
          <div className="bg-white p-2 border border-hair shrink-0">
            <QRCodeSVG value={portalUrl} size={120} />
          </div>
          <p className="text-xs text-ink-2 leading-relaxed">
            Il cliente lo scannerizza (se è già loggato sul telefono apre subito il suo portale con
            le foto). Puoi stampare questo QR e lasciarlo in cantiere, o mandarlo via WhatsApp.
          </p>
        </div>
      )}

      <div className="p-4 flex flex-wrap items-end gap-3 border-b border-hair">
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <label className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3">
            Didascalia (opzionale)
          </label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="es. Bagno — posa piastrelle"
            className="border border-hair bg-paper px-2 py-2 text-sm outline-none focus:border-terra w-full"
          />
        </div>
        <label className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-ink-3 hover:text-terra cursor-pointer">
          {uploading ? "Caricamento…" : "+ Carica foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {error && <p className="px-4 pt-3 text-terra-dark text-xs">{error}</p>}

      {photos.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-3">Nessuna foto caricata.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-hair p-px">
          {photos.map((photo) => (
            <div key={photo.id} className="relative bg-paper-2 group">
              {urls[photo.file_path] ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={urls[photo.file_path]}
                  alt={photo.caption ?? "Foto cantiere"}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-paper-4" />
              )}
              {photo.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[10.5px] px-2 py-1 truncate">
                  {photo.caption}
                </div>
              )}
              <button
                onClick={() => handleDelete(photo)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Elimina"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
