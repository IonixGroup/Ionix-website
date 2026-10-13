import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/session";
import LogoutButton from "@/components/logout-button";
import ProfessionistiClient from "./professionisti-client";

export const dynamic = "force-dynamic";

export default async function ProfessionistiPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (session.profile?.role === "client") redirect("/portal");

  const supabase = await createClient();

  const { data: professionals, error } = await supabase
    .from("professionals")
    .select("*")
    .order("active", { ascending: false })
    .order("full_name", { ascending: true });

  const { data: photoRows } = professionals?.length
    ? await supabase.storage
        .from("professionals")
        .createSignedUrls(
          professionals.filter((p) => p.photo_path).map((p) => p.photo_path as string),
          3600,
        )
    : { data: null };

  const photoUrlByPath = new Map(
    (photoRows ?? [])
      .filter((p) => p.signedUrl)
      .map((p) => [p.path, p.signedUrl as string]),
  );

  return (
    <main className="flex-1 px-6 py-10 md:px-10 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-baseline gap-2">
          <span className="font-serif font-medium text-base tracking-[0.1em]">IONIX</span>
          <span className="font-mono text-[7px] tracking-[0.2em] uppercase text-terra">Group</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/board"
            className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3 hover:text-terra"
          >
            Bacheca
          </Link>
          <Link
            href="/board/squadra"
            className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3 hover:text-terra"
          >
            Squadra
          </Link>
          <Link
            href="/board/calendario"
            className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3 hover:text-terra"
          >
            Calendario
          </Link>
          {session.profile?.role === "owner" && (
            <Link
              href="/board/notifiche"
              className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3 hover:text-terra"
            >
              Notifiche
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      <div className="mb-8">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-2 mb-2">
          Professionisti
        </div>
        <h1 className="font-serif text-3xl md:text-4xl -tracking-[0.01em]">
          Geometri, architetti, responsabili
        </h1>
      </div>

      {error && <p className="text-terra-dark text-sm mb-6">{error.message}</p>}

      <ProfessionistiClient
        initialProfessionals={professionals ?? []}
        initialPhotoUrls={Object.fromEntries(photoUrlByPath)}
      />
    </main>
  );
}
