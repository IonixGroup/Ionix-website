import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/session";
import LogoutButton from "@/components/logout-button";
import CalendarioClient from "./calendario-client";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (session.profile?.role !== "team" && session.profile?.role !== "owner") redirect("/portal");

  const supabase = await createClient();

  const { data: workers } = await supabase
    .from("workers")
    .select("*")
    .eq("active", true)
    .order("full_name", { ascending: true });

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("created_at", { ascending: true });

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
          Calendario presenze
        </div>
        <h1 className="font-serif text-3xl md:text-4xl -tracking-[0.01em]">
          Chi va dove, quando
        </h1>
      </div>

      {workers && workers.length === 0 ? (
        <p className="text-ink-2 text-sm">
          Nessun lavoratore in squadra — aggiungili dalla pagina{" "}
          <Link href="/board/squadra" className="underline hover:text-terra">
            Squadra
          </Link>
          .
        </p>
      ) : projects && projects.length === 0 ? (
        <p className="text-ink-2 text-sm">Nessun cantiere trovato.</p>
      ) : (
        <CalendarioClient workers={workers ?? []} projects={projects ?? []} />
      )}
    </main>
  );
}
