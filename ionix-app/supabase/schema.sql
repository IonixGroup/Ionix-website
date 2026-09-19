-- Ionix Group app — schema iniziale (progetti + bacheca lavori)
-- Da incollare in Supabase: Dashboard -> SQL Editor -> New query -> Run.

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists tasks_project_id_idx on tasks(project_id);

alter table projects enable row level security;
alter table tasks enable row level security;

-- ATTENZIONE — accesso temporaneo e permissivo.
-- Finché l'app non ha un login per la squadra, chiunque abbia il link può
-- leggere e modificare la bacheca. Va bene per provare la bacheca oggi;
-- PRIMA di darla in mano alla squadra va sostituito con policy legate
-- all'utente autenticato (es. tabella profiles con ruolo 'team').
create policy "temp_anon_select_projects" on projects for select using (true);
create policy "temp_anon_select_tasks" on tasks for select using (true);
create policy "temp_anon_insert_tasks" on tasks for insert with check (true);
create policy "temp_anon_update_tasks" on tasks for update using (true);
create policy "temp_anon_delete_tasks" on tasks for delete using (true);

-- Dati di esempio per provare subito la bacheca.
insert into projects (id, name, address) values
  ('11111111-1111-1111-1111-111111111111', 'Attico — Via Appia Nuova', 'Via Appia Nuova 142, Roma'),
  ('22222222-2222-2222-2222-222222222222', 'Villa — Ostia', 'Ostia, Roma')
on conflict (id) do nothing;

insert into tasks (project_id, title, status, position) values
  ('11111111-1111-1111-1111-111111111111', 'Ordinare piastrelle bagno', 'todo', 1),
  ('11111111-1111-1111-1111-111111111111', 'Contattare idraulico per collaudo', 'todo', 2),
  ('11111111-1111-1111-1111-111111111111', 'Posa parquet camera', 'in_progress', 1),
  ('11111111-1111-1111-1111-111111111111', 'Demolizione bagno', 'done', 1),
  ('11111111-1111-1111-1111-111111111111', 'Rimozione infissi vecchi', 'done', 2),
  ('22222222-2222-2222-2222-222222222222', 'Preventivo elettricista', 'todo', 1),
  ('22222222-2222-2222-2222-222222222222', 'Scavo per impianto irrigazione', 'in_progress', 1)
on conflict do nothing;
