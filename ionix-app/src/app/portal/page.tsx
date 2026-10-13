import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/session";
import { formatDateIt, paymentStatusColor } from "@/lib/format";
import LogoutButton from "@/components/logout-button";
import PortalDocuments from "./portal-documents";

export const dynamic = "force-dynamic";

const COLOR_CLASS = {
  green: "bg-green/15 text-green",
  amber: "bg-amber/15 text-amber",
  orange: "bg-orange/15 text-orange",
  red: "bg-red/15 text-red",
};

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

  const { data: payments } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_payment", true)
    .order("due_date", { ascending: true, nullsFirst: false });

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const { data: photoSigned } = photos?.length
    ? await supabase.storage
        .from("photos")
        .createSignedUrls(
          photos.map((p) => p.file_path),
          3600,
        )
    : { data: null };

  const photoUrls = Object.fromEntries(
    (photoSigned ?? []).filter((p) => p.signedUrl).map((p) => [p.path, p.signedUrl as string]),
  );

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

      {payments && payments.length > 0 && (
        <div className="mb-10">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-2 mb-4">
            Pagamenti
          </div>
          <div className="border border-hair bg-paper-2">
            {payments.map((p) => {
              const status = paymentStatusColor(p.due_date, p.payment_paid);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-hair last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="text-sm">{p.payment_label ?? p.title}</div>
                    {p.due_date && (
                      <div className="font-mono text-[10px] text-ink-3">
                        Scadenza {formatDateIt(p.due_date)}
                      </div>
                    )}
                  </div>
                  {p.payment_amount && (
                    <span className="font-mono text-[11px] text-ink-2 shrink-0">
                      €{p.payment_amount}
                    </span>
                  )}
                  <span
                    className={`font-mono text-[9px] tracking-[0.08em] uppercase px-2 py-1 shrink-0 ${COLOR_CLASS[status.color]}`}
                  >
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {photos && photos.length > 0 && (
        <div className="mb-10">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-2 mb-4">
            Foto cantiere
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-hair p-px">
            {photos.map((photo) => (
              <div key={photo.id} className="relative bg-paper-2">
                {photoUrls[photo.file_path] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photoUrls[photo.file_path]}
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
              </div>
            ))}
          </div>
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
