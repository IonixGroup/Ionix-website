import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/session";
import AccountForm from "./account-form";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (session.profile?.role !== "team") redirect("/board");

  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("created_at", { ascending: true });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, role, full_name, project_id")
    .order("created_at", { ascending: true });

  const projectName = (id: string | null) => projects?.find((p) => p.id === id)?.name ?? "—";

  return (
    <main className="flex-1 px-6 py-10 md:px-10 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-baseline gap-2">
          <span className="font-serif font-medium text-base tracking-[0.1em]">IONIX</span>
          <span className="font-mono text-[7px] tracking-[0.2em] uppercase text-terra">Group</span>
        </div>
        <Link
          href="/board"
          className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3 hover:text-terra"
        >
          ← Torna alla bacheca
        </Link>
      </div>

      <div className="mb-8">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-2 mb-2">
          Account · solo squadra
        </div>
        <h1 className="font-serif text-3xl -tracking-[0.01em]">Crea un accesso</h1>
      </div>

      <AccountForm projects={projects ?? []} />

      <div className="mt-14">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-2 mb-4">
          Account esistenti
        </div>
        <div className="border border-hair">
          {(profiles ?? []).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-3 border-b border-hair last:border-b-0 text-sm"
            >
              <span>{p.full_name || "—"}</span>
              <span className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-ink-3">
                {p.role === "team" ? "Squadra" : `Cliente · ${projectName(p.project_id)}`}
              </span>
            </div>
          ))}
          {(!profiles || profiles.length === 0) && (
            <p className="px-4 py-6 text-sm text-ink-3">Nessun account ancora.</p>
          )}
        </div>
      </div>
    </main>
  );
}
