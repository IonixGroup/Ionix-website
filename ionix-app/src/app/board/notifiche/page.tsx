import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/session";
import LogoutButton from "@/components/logout-button";
import { formatDateIt, daysUntil } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NotifichePage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (session.profile?.role !== "owner") redirect("/board");

  const supabase = await createClient();

  const { data: completed } = await supabase
    .from("milestones")
    .select("*, projects(name)")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(20);

  const { data: upcoming } = await supabase
    .from("milestones")
    .select("*, projects(name)")
    .is("completed_at", null)
    .not("due_date", "is", null)
    .order("due_date", { ascending: true })
    .limit(30);

  return (
    <main className="flex-1 px-6 py-10 md:px-10 max-w-3xl mx-auto w-full">
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
          <LogoutButton />
        </div>
      </div>

      <div className="mb-10">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-2 mb-2">
          Riservato · titolari
        </div>
        <h1 className="font-serif text-3xl md:text-4xl -tracking-[0.01em]">Notifiche</h1>
      </div>

      <section className="mb-10">
        <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-2 mb-3">
          In scadenza
        </div>
        {!upcoming || upcoming.length === 0 ? (
          <p className="text-sm text-ink-3">Nessuna milestone con scadenza in corso.</p>
        ) : (
          <div className="border border-hair bg-paper-2">
            {upcoming.map((m) => {
              const diff = m.due_date ? daysUntil(m.due_date) : null;
              const urgent = diff !== null && diff <= 3;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-hair last:border-b-0"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${urgent ? "bg-red" : "bg-amber"}`} />
                  <div className="flex-1">
                    <div className="text-sm">{m.title}</div>
                    <div className="font-mono text-[10px] text-ink-3">
                      {(m as { projects?: { name: string } | null }).projects?.name ?? "Cantiere"}
                      {m.is_payment && m.payment_label ? ` · ${m.payment_label}` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-[10.5px] text-ink-2">
                      {m.due_date && formatDateIt(m.due_date)}
                    </div>
                    {diff !== null && (
                      <div className={`font-mono text-[9.5px] ${urgent ? "text-red" : "text-ink-3"}`}>
                        {diff < 0
                          ? `scaduta da ${Math.abs(diff)}g`
                          : diff === 0
                            ? "oggi"
                            : `tra ${diff}g`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-2 mb-3">
          Completate di recente
        </div>
        {!completed || completed.length === 0 ? (
          <p className="text-sm text-ink-3">Nessuna milestone completata ancora.</p>
        ) : (
          <div className="border border-hair bg-paper-2">
            {completed.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-hair last:border-b-0"
              >
                <span className="w-2 h-2 rounded-full bg-green shrink-0" />
                <div className="flex-1">
                  <div className="text-sm">{m.title}</div>
                  <div className="font-mono text-[10px] text-ink-3">
                    {(m as { projects?: { name: string } | null }).projects?.name ?? "Cantiere"}
                    {m.is_payment && m.payment_label
                      ? ` · ${m.payment_label}${m.payment_paid ? " · pagata" : " · da pagare"}`
                      : ""}
                  </div>
                </div>
                <div className="font-mono text-[10.5px] text-ink-3 shrink-0">
                  {m.completed_at && formatDateIt(m.completed_at.slice(0, 10))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
