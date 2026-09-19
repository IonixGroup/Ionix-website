-- Ionix Group app — schema (progetti, bacheca lavori, documenti)
-- Da incollare in Supabase: Dashboard -> SQL Editor -> New query -> Run.
-- Puoi rieseguire questo intero file quando lo aggiorniamo: è scritto per
-- non dare errore se le tabelle/colonne/policy esistono già.

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

alter table projects add column if not exists deadline date;

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists tasks_project_id_idx on tasks(project_id);

-- Documenti per progetto: contratto e scadenza (deadline sopra) sono per il
-- cliente, preventivo e "altro" restano interni finché non c'è il portale cliente.
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  category text not null default 'altro' check (category in ('contratto', 'preventivo', 'altro')),
  client_visible boolean not null default false,
  file_path text not null,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists documents_project_id_idx on documents(project_id);

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

alter table projects enable row level security;
alter table tasks enable row level security;
alter table documents enable row level security;

-- ATTENZIONE — accesso temporaneo e permissivo.
-- Finché l'app non ha un login per la squadra, chiunque abbia il link può
-- leggere e modificare bacheca e documenti. Va bene per provare oggi;
-- PRIMA di darla in mano alla squadra va sostituito con policy legate
-- all'utente autenticato (es. tabella profiles con ruolo 'team').
drop policy if exists "temp_anon_select_projects" on projects;
create policy "temp_anon_select_projects" on projects for select using (true);
drop policy if exists "temp_anon_update_projects" on projects;
create policy "temp_anon_update_projects" on projects for update using (true);

drop policy if exists "temp_anon_select_tasks" on tasks;
create policy "temp_anon_select_tasks" on tasks for select using (true);
drop policy if exists "temp_anon_insert_tasks" on tasks;
create policy "temp_anon_insert_tasks" on tasks for insert with check (true);
drop policy if exists "temp_anon_update_tasks" on tasks;
create policy "temp_anon_update_tasks" on tasks for update using (true);
drop policy if exists "temp_anon_delete_tasks" on tasks;
create policy "temp_anon_delete_tasks" on tasks for delete using (true);

drop policy if exists "temp_anon_select_documents" on documents;
create policy "temp_anon_select_documents" on documents for select using (true);
drop policy if exists "temp_anon_insert_documents" on documents;
create policy "temp_anon_insert_documents" on documents for insert with check (true);
drop policy if exists "temp_anon_update_documents" on documents;
create policy "temp_anon_update_documents" on documents for update using (true);
drop policy if exists "temp_anon_delete_documents" on documents;
create policy "temp_anon_delete_documents" on documents for delete using (true);

drop policy if exists "temp_anon_all_documents_bucket" on storage.objects;
create policy "temp_anon_all_documents_bucket" on storage.objects
  for all using (bucket_id = 'documents') with check (bucket_id = 'documents');

-- Dati di esempio per provare subito la bacheca.
insert into projects (id, name, address, deadline) values
  ('11111111-1111-1111-1111-111111111111', 'Attico — Via Appia Nuova', 'Via Appia Nuova 142, Roma', '2026-12-18'),
  ('22222222-2222-2222-2222-222222222222', 'Villa — Ostia', 'Ostia, Roma', '2027-02-10')
on conflict (id) do update set deadline = excluded.deadline;

insert into tasks (project_id, title, status, position) values
  ('11111111-1111-1111-1111-111111111111', 'Ordinare piastrelle bagno', 'todo', 1),
  ('11111111-1111-1111-1111-111111111111', 'Contattare idraulico per collaudo', 'todo', 2),
  ('11111111-1111-1111-1111-111111111111', 'Posa parquet camera', 'in_progress', 1),
  ('11111111-1111-1111-1111-111111111111', 'Demolizione bagno', 'done', 1),
  ('11111111-1111-1111-1111-111111111111', 'Rimozione infissi vecchi', 'done', 2),
  ('22222222-2222-2222-2222-222222222222', 'Preventivo elettricista', 'todo', 1),
  ('22222222-2222-2222-2222-222222222222', 'Scavo per impianto irrigazione', 'in_progress', 1)
on conflict do nothing;
