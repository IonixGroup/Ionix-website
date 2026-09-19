import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/session";
import { formatDateIt } from "@/lib/format";
import LogoutButton from "@/components/logout-button";
import PortalDocuments from "./portal-documents";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (session.profile?.role !== "client") redirect("/board");

  const projectId = session.profile.project_id;

  const header = (
    <div className="flex items-center justify-between mb-10">
      <div className="flex items-baseline gap-2">
        <span className="font-serif font-medium text-base tracking-[0.1em]">IONIX</span>
        <span className="font-mono text-[7px] tracking-[0.2em] uppercase text-terra">Group</span>
      </div>
      <LogoutButton />
    </div>
  );

  if (!projectId) {
    return (
      <main className="flex-1 px-6 py-10 md:px-10 max-w-2xl mx-auto w-full">
        {header}
        <p className="text-ink-2 text-sm">
          Il tuo account non è ancora collegato a un progetto. Contatta Ionix Group.
        </p>
      </main>
    );
  }

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .eq("client_visible", true)
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 px-6 py-10 md:px-10 max-w-2xl mx-auto w-full">
      {header}

      <div className="mb-10">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-2 mb-2">
          Il tuo progetto
        </div>
        <h1 className="font-serif text-3xl md:text-4xl -tracking-[0.01em] mb-2">
          {project?.name ?? "Progetto"}
        </h1>
        {project?.address && (
          <p className="text-ink-2 font-light text-sm">{project.address}</p>
        )}
      </div>

      {project?.deadline && (
        <div className="bg-terra-soft px-6 py-5 mb-10">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-terra-dark mb-1">
            Consegna garantita per contratto
          </div>
          <div className="font-serif text-2xl">{formatDateIt(project.deadline)}</div>
        </div>
      )}

      <div>
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-2 mb-4">
          Documenti
        </div>
        <PortalDocuments documents={documents ?? []} />
      </div>
    </main>
  );
}
