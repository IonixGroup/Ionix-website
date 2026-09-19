"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/supabase/session";

function generatePassword() {
  // Facile da leggere/dettare al telefono: 3 blocchi separati da trattino.
  const block = () => Math.random().toString(36).slice(2, 6);
  return `${block()}-${block()}-${block()}`;
}

export async function createAccount(formData: FormData) {
  const session = await getSessionProfile();
  if (!session || session.profile?.role !== "team") {
    return { error: "Non autorizzato." };
  }

  const email = String(formData.get("email") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "");
  const projectId = String(formData.get("project_id") || "");

  if (!email || (role !== "team" && role !== "client")) {
    return { error: "Dati mancanti." };
  }
  if (role === "client" && !projectId) {
    return { error: "Seleziona il progetto del cliente." };
  }

  const password = generatePassword();
  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Configurazione mancante." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message || "Creazione account non riuscita." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    role,
    project_id: role === "client" ? projectId : null,
    full_name: fullName || null,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: profileError.message };
  }

  return { email, password };
}
