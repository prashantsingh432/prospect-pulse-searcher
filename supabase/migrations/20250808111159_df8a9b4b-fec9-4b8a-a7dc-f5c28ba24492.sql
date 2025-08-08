-- RTNE core schema (retry without IF NOT EXISTS on policies)
-- Create tables

-- master_prospects: single canonical record per LinkedIn profile
create table if not exists public.master_prospects (
  id uuid primary key default gen_random_uuid(),
  linkedin_id text not null,
  canonical_url text not null,
  full_name text,
  company_name text,
  prospect_city text,
  prospect_number text,
  prospect_email text,
  prospect_number2 text,
  prospect_number3 text,
  prospect_number4 text,
  prospect_designation text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified boolean not null default false,
  constraint uq_master_prospects_linkedin_id unique (linkedin_id),
  constraint uq_master_prospects_canonical_url unique (canonical_url)
);

create index if not exists idx_master_prospects_linkedin_id on public.master_prospects (linkedin_id);
create index if not exists idx_master_prospects_canonical_url on public.master_prospects (canonical_url);

-- projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_projects_owner_id on public.projects(owner_id);

-- project_users: assignment of users to projects
create table if not exists public.project_users (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member', -- owner | manager | member
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_project_users unique (project_id, user_id)
);
create index if not exists idx_project_users_user_id on public.project_users(user_id);
create index if not exists idx_project_users_project_id on public.project_users(project_id);

-- project_prospects: mapping master prospects into projects, with one-time credit
create table if not exists public.project_prospects (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  master_prospect_id uuid not null references public.master_prospects(id) on delete cascade,
  added_by uuid not null references public.users(id) on delete set null,
  credit_allocated boolean not null default false,
  credited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_project_prospect unique (project_id, master_prospect_id)
);
create index if not exists idx_project_prospects_project_id on public.project_prospects(project_id);
create index if not exists idx_project_prospects_master_id on public.project_prospects(master_prospect_id);

-- credits log
create table if not exists public.credits_log (
  id uuid primary key default gen_random_uuid(),
  master_prospect_id uuid not null references public.master_prospects(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null, -- allocate | reassign | override
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_credits_log_master on public.credits_log(master_prospect_id);
create index if not exists idx_credits_log_project on public.credits_log(project_id);
create index if not exists idx_credits_log_user on public.credits_log(user_id);

-- enrichment jobs (async)
create table if not exists public.enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  master_prospect_id uuid not null references public.master_prospects(id) on delete cascade,
  status text not null default 'pending', -- pending | processing | completed | failed
  provider text,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_enrichment_jobs_master on public.enrichment_jobs(master_prospect_id);
create index if not exists idx_enrichment_jobs_status on public.enrichment_jobs(status);

-- notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  payload jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read);

-- audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_logs_user on public.audit_logs(user_id);

-- Triggers for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach triggers
create trigger if not exists trg_master_prospects_updated
before update on public.master_prospects
for each row execute procedure public.set_updated_at();

create trigger if not exists trg_projects_updated
before update on public.projects
for each row execute procedure public.set_updated_at();

create trigger if not exists trg_project_users_updated
before update on public.project_users
for each row execute procedure public.set_updated_at();

create trigger if not exists trg_project_prospects_updated
before update on public.project_prospects
for each row execute procedure public.set_updated_at();

create trigger if not exists trg_enrichment_jobs_updated
before update on public.enrichment_jobs
for each row execute procedure public.set_updated_at();

-- Enable RLS
alter table public.master_prospects enable row level security;
alter table public.projects enable row level security;
alter table public.project_users enable row level security;
alter table public.project_prospects enable row level security;
alter table public.credits_log enable row level security;
alter table public.enrichment_jobs enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Policies
-- master_prospects
create policy "RTNE - Authenticated can read master prospects"
  on public.master_prospects for select
  using (auth.uid() is not null);

create policy "RTNE - Creators/Admin can insert master prospects"
  on public.master_prospects for insert
  with check (auth.uid() = created_by or get_current_user_role() = 'admin');

create policy "RTNE - Admins/Project owners can update master prospects"
  on public.master_prospects for update
  using (
    get_current_user_role() = 'admin'
    or exists (
      select 1 from public.project_prospects pp
      join public.project_users pu on pu.project_id = pp.project_id
      where pp.master_prospect_id = master_prospects.id
        and pu.user_id = auth.uid()
        and pu.role in ('owner','manager')
    )
  );

-- projects
create policy "RTNE - Members/Admin can read projects"
  on public.projects for select
  using (
    get_current_user_role() = 'admin'
    or exists (
      select 1 from public.project_users pu where pu.project_id = projects.id and pu.user_id = auth.uid()
    )
  );

create policy "RTNE - Users can create their own projects"
  on public.projects for insert
  with check (owner_id = auth.uid());

create policy "RTNE - Owners/Admin can update projects"
  on public.projects for update
  using (owner_id = auth.uid() or get_current_user_role() = 'admin');

-- project_users
create policy "RTNE - Users/Admin can read their project memberships"
  on public.project_users for select
  using (user_id = auth.uid() or get_current_user_role() = 'admin');

create policy "RTNE - Owners/Admin can manage project memberships"
  on public.project_users for insert
  with check (
    get_current_user_role() = 'admin'
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "RTNE - Owners/Admin can update project memberships"
  on public.project_users for update
  using (
    get_current_user_role() = 'admin'
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "RTNE - Owners/Admin can delete project memberships"
  on public.project_users for delete
  using (
    get_current_user_role() = 'admin'
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- project_prospects
create policy "RTNE - Members/Admin can read project prospects"
  on public.project_prospects for select
  using (
    get_current_user_role() = 'admin'
    or exists (
      select 1 from public.project_users pu where pu.project_id = project_prospects.project_id and pu.user_id = auth.uid()
    )
  );

create policy "RTNE - Members can insert project prospects they add"
  on public.project_prospects for insert
  with check (
    added_by = auth.uid()
    and exists (
      select 1 from public.project_users pu where pu.project_id = project_id and pu.user_id = auth.uid()
    )
  );

create policy "RTNE - Admins can update project prospects"
  on public.project_prospects for update
  using (get_current_user_role() = 'admin');

create policy "RTNE - Owners/Admin can delete project prospects"
  on public.project_prospects for delete
  using (
    get_current_user_role() = 'admin'
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- credits_log
create policy "RTNE - Users/Admin can read their credits logs"
  on public.credits_log for select
  using (user_id = auth.uid() or get_current_user_role() = 'admin');

create policy "RTNE - Users/Admin can insert credits logs"
  on public.credits_log for insert
  with check (user_id = auth.uid() or get_current_user_role() = 'admin');

-- enrichment_jobs
create policy "RTNE - Members/Admin can read enrichment jobs"
  on public.enrichment_jobs for select
  using (
    get_current_user_role() = 'admin'
    or exists (
      select 1 from public.project_prospects pp
      join public.project_users pu on pu.project_id = pp.project_id
      where pp.master_prospect_id = enrichment_jobs.master_prospect_id
        and pu.user_id = auth.uid()
    )
  );

create policy "RTNE - Members/Admin can create enrichment jobs"
  on public.enrichment_jobs for insert
  with check (
    get_current_user_role() = 'admin'
    or exists (
      select 1 from public.project_prospects pp
      join public.project_users pu on pu.project_id = pp.project_id
      where pp.master_prospect_id = master_prospect_id
        and pu.user_id = auth.uid()
    )
  );

create policy "RTNE - Admins can update enrichment jobs"
  on public.enrichment_jobs for update
  using (get_current_user_role() = 'admin');

-- notifications
create policy "RTNE - Users/Admin can read their notifications"
  on public.notifications for select
  using (user_id = auth.uid() or get_current_user_role() = 'admin');

create policy "RTNE - Users/Admin can insert notifications"
  on public.notifications for insert
  with check (user_id = auth.uid() or get_current_user_role() = 'admin');

create policy "RTNE - Users/Admin can update their notifications"
  on public.notifications for update
  using (user_id = auth.uid() or get_current_user_role() = 'admin');

-- audit_logs
create policy "RTNE - Users/Admin can read their audit logs"
  on public.audit_logs for select
  using (user_id = auth.uid() or get_current_user_role() = 'admin');

create policy "RTNE - Users/Admin can insert audit logs"
  on public.audit_logs for insert
  with check (user_id = auth.uid() or get_current_user_role() = 'admin');
