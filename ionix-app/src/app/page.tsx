import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/session";

export default async function Home() {
  const session = await getSessionProfile();

  if (!session) redirect("/login");
  if (session.profile?.role === "client") redirect("/portal");
  if (session.profile?.role === "team") redirect("/board");

  // Autenticato ma senza profilo (account non ancora assegnato a un ruolo).
  redirect("/login?error=no-profile");
}
