import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BoardClient from "./board-client";

export const dynamic = "force-dynamic";

export default async function BoardPage(props: PageProps<"/board">) {
  const { project: projectParam } = await props.searchParams;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <ConnectionNotice message="Variabili NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY mancanti in .env.local." />
    );
  }

  const supabase = await createClient();

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });

  if (projectsError) {
    return <ConnectionNotice message={projectsError.message} />;
  }

  const activeProjectId =
    (typeof projectParam === "string" ? projectParam : undefined) ??
    projects?.[0]?.id;

  const activeProject = projects?.find((p) => p.id === activeProjectId);

  const { data: tasks, error: tasksError } = activeProjectId
    ? await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", activeProjectId)
        .order("position", { ascending: true })
    : { data: [], error: null };

  if (tasksError) {
    return <ConnectionNotice message={tasksError.message} />;
  }

  return (
    <main className="flex-1 px-6 py-10 md:px-10 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-2 mb-2">
          Bacheca lavori · solo squadra
        </div>
        <h1 className="font-serif text-3xl md:text-4xl -tracking-[0.01em]">
          {activeProject ? activeProject.name : "Nessun progetto"}
        </h1>
        {activeProject?.address && (
          <p className="text-ink-2 font-light text-sm mt-1">{activeProject.address}</p>
        )}
      </div>

      {projects && projects.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/board?project=${p.id}`}
              className={`font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-2 border ${
                p.id === activeProjectId
                  ? "bg-ink text-paper border-ink"
                  : "border-hair text-ink-2 hover:text-ink"
              }`}
            >
              {p.name}
            </Link>
          ))}
        </div>
      )}

      {activeProjectId ? (
        <BoardClient projectId={activeProjectId} initialTasks={tasks ?? []} />
      ) : (
        <p className="text-ink-2">
          Nessun progetto trovato — esegui lo schema in supabase/schema.sql sul tuo progetto Supabase.
        </p>
      )}
    </main>
  );
}

function ConnectionNotice({ message }: { message: string }) {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-md border border-hair p-8">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-terra-dark mb-3">
          Supabase non collegato
        </div>
        <p className="text-sm text-ink-2 leading-relaxed mb-4">
          Crea un progetto gratuito su supabase.com, esegui{" "}
          <code className="font-mono text-ink">supabase/schema.sql</code> nel SQL editor, poi copia
          Project URL e anon key in <code className="font-mono text-ink">.env.local</code>{" "}
          (vedi <code className="font-mono text-ink">.env.example</code>).
        </p>
        <p className="font-mono text-[11px] text-ink-3">{message}</p>
      </div>
    </main>
  );
}
