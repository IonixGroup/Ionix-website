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

-- =========================================================================
-- Estensione: ruolo "owner", lavoratori, presenze, milestone/pagamenti, foto
-- =========================================================================

-- Il ruolo "owner" (titolari) vede tutto quello che vede "team" — le policy
-- "team_*" già esistenti restano invariate perché usano is_team(), che qui
-- sotto viene ridefinita per includere anche "owner". In più, "owner" ha
-- accesso a una pagina riservata con le notifiche sulle milestone.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('team', 'client', 'owner'));

create or replace function public.is_team()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('team', 'owner'));
$$;

create or replace function public.is_owner()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'owner');
$$;

-- Documenti: aggiunta la categoria "fattura" a contratto/preventivo/altro.
alter table documents drop constraint if exists documents_category_check;
alter table documents add constraint documents_category_check
  check (category in ('contratto', 'preventivo', 'fattura', 'altro'));

-- Lavoratori: rubrica squadra con foto. Serve per registrare le presenze
-- (tabella attendance sotto) e per la pagina "Squadra".
create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  photo_path text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table workers enable row level security;

drop policy if exists "team_all_workers" on workers;
create policy "team_all_workers" on workers for all
  using (public.is_team()) with check (public.is_team());

insert into storage.buckets (id, name, public)
values ('workers', 'workers', false)
on conflict (id) do nothing;

drop policy if exists "team_all_workers_bucket" on storage.objects;
create policy "team_all_workers_bucket" on storage.objects for all
  using (bucket_id = 'workers' and public.is_team())
  with check (bucket_id = 'workers' and public.is_team());

-- Presenze: in quale cantiere è stato un lavoratore, in quale giorno. Solo
-- squadra/titolari, il cliente non la vede mai.
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  work_date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists attendance_worker_id_idx on attendance(worker_id);
create index if not exists attendance_project_id_idx on attendance(project_id);

alter table attendance enable row level security;

drop policy if exists "team_all_attendance" on attendance;
create policy "team_all_attendance" on attendance for all
  using (public.is_team()) with check (public.is_team());

-- Milestone: tappe del cantiere (project management). Una milestone può
-- essere anche legata a una rata di pagamento (is_payment = true): quando
-- squadra/titolari la segnano, diventa visibile al cliente nel portale come
-- scadenza di pagamento, colorata in base a quanto manca. Le milestone che
-- non sono di pagamento restano interne (il cliente non le vede: possono
-- contenere note di lavorazione non destinate a lui).
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  position double precision not null default 0,
  due_date date,
  completed_at timestamptz,
  is_payment boolean not null default false,
  payment_label text,
  payment_amount numeric(10,2),
  payment_paid boolean not null default false,
  payment_paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists milestones_project_id_idx on milestones(project_id);

alter table milestones enable row level security;

drop policy if exists "team_all_milestones" on milestones;
create policy "team_all_milestones" on milestones for all
  using (public.is_team()) with check (public.is_team());

drop policy if exists "client_select_payment_milestones" on milestones;
create policy "client_select_payment_milestones" on milestones for select
  using (is_payment = true and project_id = public.my_project_id());

-- Foto: quelle che la squadra carica e che il cliente vede nel portale,
-- ognuna con un proprio QR code generato lato app (non serve colonna).
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  file_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists photos_project_id_idx on photos(project_id);

alter table photos enable row level security;

drop policy if exists "team_all_photos" on photos;
create policy "team_all_photos" on photos for all
  using (public.is_team()) with check (public.is_team());

drop policy if exists "client_select_own_photos" on photos;
create policy "client_select_own_photos" on photos for select
  using (project_id = public.my_project_id());

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "team_all_photos_bucket" on storage.objects;
create policy "team_all_photos_bucket" on storage.objects for all
  using (bucket_id = 'photos' and public.is_team())
  with check (bucket_id = 'photos' and public.is_team());

drop policy if exists "client_select_own_photos_bucket" on storage.objects;
create policy "client_select_own_photos_bucket" on storage.objects for select
  using (
    bucket_id = 'photos' and exists (
      select 1 from photos p
      where p.file_path = storage.objects.name
        and p.project_id = public.my_project_id()
    )
  );

-- =========================================================================
-- Estensione: fascia e paga giornaliera lavoratore, calendario presenze,
-- resoconto settimanale per il compenso.
-- =========================================================================

-- Fascia del lavoratore ("Junior" = meno esperto, "Pro" = con esperienza) e
-- la sua paga giornaliera, usata per calcolare il resoconto settimanale.
alter table workers add column if not exists tier text not null default 'junior'
  check (tier in ('junior', 'pro'));
alter table workers add column if not exists daily_rate numeric(10,2);

-- Quante giornate vale una presenza (1 = giornata intera, 0.5 = mezza),
-- per calcolare il compenso dovuto con precisione.
alter table attendance add column if not exists units numeric(3,2) not null default 1
  check (units > 0 and units <= 2);

-- =========================================================================
-- Estensione: professionisti (geometri/architetti/ingegneri, capo cantiere,
-- responsabile del progetto) e squadra assegnata a ciascun cantiere,
-- visibile al cliente nel portale.
-- =========================================================================

-- Albo professionisti: non sono "lavoratori" (niente presenze/paga), ognuno
-- ha un titolo, una breve biografia e i contatti diretti.
create table if not exists professionals (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  title text not null, -- es. "Architetto", "Geometra", "Ingegnere", "Capo cantiere", "Responsabile del progetto"
  bio text,
  phone text,
  email text,
  photo_path text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table professionals enable row level security;

drop policy if exists "team_all_professionals" on professionals;
create policy "team_all_professionals" on professionals for all
  using (public.is_team()) with check (public.is_team());

insert into storage.buckets (id, name, public)
values ('professionals', 'professionals', false)
on conflict (id) do nothing;

drop policy if exists "team_all_professionals_bucket" on storage.objects;
create policy "team_all_professionals_bucket" on storage.objects for all
  using (bucket_id = 'professionals' and public.is_team())
  with check (bucket_id = 'professionals' and public.is_team());

-- Squadra assegnata a un cantiere: collega un professionista a un progetto
-- con un ruolo specifico per quel cantiere (può differire dal titolo
-- generale, es. un geometra assegnato come "Capo cantiere" su un progetto).
create table if not exists project_team (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  role_label text not null,
  created_at timestamptz not null default now(),
  unique (project_id, professional_id, role_label)
);

create index if not exists project_team_project_id_idx on project_team(project_id);
create index if not exists project_team_professional_id_idx on project_team(professional_id);

alter table project_team enable row level security;

drop policy if exists "team_all_project_team" on project_team;
create policy "team_all_project_team" on project_team for all
  using (public.is_team()) with check (public.is_team());

drop policy if exists "client_select_own_project_team" on project_team;
create policy "client_select_own_project_team" on project_team for select
  using (project_id = public.my_project_id());

-- Il cliente vede solo i professionisti assegnati al proprio progetto.
drop policy if exists "client_select_assigned_professionals" on professionals;
create policy "client_select_assigned_professionals" on professionals for select
  using (
    exists (
      select 1 from project_team pt
      where pt.professional_id = professionals.id
        and pt.project_id = public.my_project_id()
    )
  );

drop policy if exists "client_select_assigned_professionals_bucket" on storage.objects;
create policy "client_select_assigned_professionals_bucket" on storage.objects for select
  using (
    bucket_id = 'professionals' and exists (
      select 1 from professionals p
      join project_team pt on pt.professional_id = p.id
      where p.photo_path = storage.objects.name
        and pt.project_id = public.my_project_id()
    )
  );

-- =========================================================================
-- Estensione: anticipi ai lavoratori, da sottrarre nel resoconto del periodo.
-- =========================================================================

create table if not exists advances (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  advance_date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists advances_worker_id_idx on advances(worker_id);

alter table advances enable row level security;

drop policy if exists "team_all_advances" on advances;
create policy "team_all_advances" on advances for all
  using (public.is_team()) with check (public.is_team());
