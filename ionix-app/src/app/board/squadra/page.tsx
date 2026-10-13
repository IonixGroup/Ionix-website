import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/session";
import LogoutButton from "@/components/logout-button";
import SquadraClient from "./squadra-client";

export const dynamic = "force-dynamic";

export default async function SquadraPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (session.profile?.role === "client") redirect("/portal");

  const supabase = await createClient();

  const { data: workers, error } = await supabase
    .from("workers")
    .select("*")
    .order("active", { ascending: false })
    .order("full_name", { ascending: true });

  const { data: photoRows } = workers?.length
    ? await supabase.storage
        .from("workers")
        .createSignedUrls(
          workers.filter((w) => w.photo_path).map((w) => w.photo_path as string),
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
          {session.profile?.role === "owner" && (
            <Link
              href="/board/notifiche"
              className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3 hover:text-terra"
            >
              Notifiche
            </Link>
          )}
          <Link
            href="/board/account"
            className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3 hover:text-terra"
          >
            Account
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="mb-8">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-2 mb-2">
          Squadra
        </div>
        <h1 className="font-serif text-3xl md:text-4xl -tracking-[0.01em]">Lavoratori</h1>
      </div>

      {error && <p className="text-terra-dark text-sm mb-6">{error.message}</p>}

      <SquadraClient
        initialWorkers={workers ?? []}
        initialPhotoUrls={Object.fromEntries(photoUrlByPath)}
      />
    </main>
  );
}
