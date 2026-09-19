-- Ionix Group app — schema (progetti, bacheca lavori, documenti, account)
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
-- cliente, preventivo e "altro" restano interni.
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

-- Un account per persona: 'team' vede tutto, 'client' vede solo il proprio
-- progetto (project_id). Le righe qui si creano dalla pagina Account
-- dell'app (o a mano su Supabase per il primissimo account team — vedi
-- README.md), mai in autoregistrazione.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('team', 'client')),
  project_id uuid references projects(id) on delete set null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;
alter table tasks enable row level security;
alter table documents enable row level security;
alter table profiles enable row level security;

-- Funzioni di appoggio (security definer: leggono profiles bypassando la RLS
-- di profiles stessa, altrimenti le policy che la usano andrebbero in loop).
create or replace function public.is_team()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'team');
$$;

create or replace function public.my_project_id()
returns uuid
language sql security definer set search_path = public stable
as $$
  select project_id from profiles where id = auth.uid() and role = 'client';
$$;

-- Pulizia delle vecchie policy permissive temporanee (fase "prova la bacheca
-- senza login"), ora sostituite da quelle vere qui sotto.
drop policy if exists "temp_anon_select_projects" on projects;
drop policy if exists "temp_anon_update_projects" on projects;
drop policy if exists "temp_anon_select_tasks" on tasks;
drop policy if exists "temp_anon_insert_tasks" on tasks;
drop policy if exists "temp_anon_update_tasks" on tasks;
drop policy if exists "temp_anon_delete_tasks" on tasks;
drop policy if exists "temp_anon_select_documents" on documents;
drop policy if exists "temp_anon_insert_documents" on documents;
drop policy if exists "temp_anon_update_documents" on documents;
drop policy if exists "temp_anon_delete_documents" on documents;
drop policy if exists "temp_anon_all_documents_bucket" on storage.objects;

-- profiles: ognuno vede la propria riga, la squadra le vede tutte.
-- Nessuna policy di insert/update/delete: gli account si creano solo dal
-- server con la service role key (pagina Account), che salta la RLS.
drop policy if exists "select_own_or_team_profiles" on profiles;
create policy "select_own_or_team_profiles" on profiles for select
  using (id = auth.uid() or public.is_team());

-- projects: la squadra ha accesso completo, il cliente vede in sola lettura
-- solo il proprio progetto.
drop policy if exists "team_all_projects" on projects;
create policy "team_all_projects" on projects for all
  using (public.is_team()) with check (public.is_team());

drop policy if exists "client_select_own_project" on projects;
create policy "client_select_own_project" on projects for select
  using (id = public.my_project_id());

-- tasks (bacheca): solo squadra, il cliente non ci accede mai.
drop policy if exists "team_all_tasks" on tasks;
create policy "team_all_tasks" on tasks for all
  using (public.is_team()) with check (public.is_team());

-- documents: la squadra ha accesso completo, il cliente vede in sola
-- lettura solo i documenti del proprio progetto marcati "visibile al cliente".
drop policy if exists "team_all_documents" on documents;
create policy "team_all_documents" on documents for all
  using (public.is_team()) with check (public.is_team());

drop policy if exists "client_select_visible_documents" on documents;
create policy "client_select_visible_documents" on documents for select
  using (client_visible = true and project_id = public.my_project_id());

-- storage (file dei documenti): stessa logica, sul bucket "documents".
drop policy if exists "team_all_documents_bucket" on storage.objects;
create policy "team_all_documents_bucket" on storage.objects for all
  using (bucket_id = 'documents' and public.is_team())
  with check (bucket_id = 'documents' and public.is_team());

drop policy if exists "client_select_visible_documents_bucket" on storage.objects;
create policy "client_select_visible_documents_bucket" on storage.objects for select
  using (
    bucket_id = 'documents' and exists (
      select 1 from documents d
      where d.file_path = storage.objects.name
        and d.client_visible = true
        and d.project_id = public.my_project_id()
    )
  );

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
