-- ============================================================================
-- Data engine schema — programs, scraped_sources, update_logs
-- ============================================================================
--
-- Status: SHIPPED BUT NOT WIRED UP.
--
-- The engine's live sink is git: it edits src/data/programs.ts and opens a
-- pull request. That was a deliberate choice — no database to pay for, no
-- credentials in CI beyond one API key, and a review surface (the PR diff)
-- that a guidance counsellor can read without an account on anything.
--
-- This migration exists for the point where that stops being enough, which is
-- roughly when any of these become true:
--   - more than ~500 listings (the PR diff stops being readable);
--   - you want update history queryable rather than sitting in git log;
--   - you want /admin/review to write directly instead of via a decisions file;
--   - more than one person reviews concurrently.
--
-- Apply with:  supabase db push        (or: psql -f this_file.sql)
-- It is idempotent and safe to run twice.
--
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";      -- fuzzy title matching for dedupe

-- Supabase provides `anon` and `authenticated`; a plain Postgres (local dev,
-- CI, `psql -f`) does not. Create them only if missing so this file applies
-- cleanly in both places.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end $$;

-- ---------------------------------------------------------------- enums ---
do $$ begin
  create type cost_type as enum ('Free', 'Paid', 'Need-Based Aid', 'Stipend', 'Unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type location_type as enum ('In-Person', 'Remote', 'Hybrid', 'Unknown');
exception when duplicate_object then null; end $$;

-- How we know a date. This mirrors scripts/engine/types.mts exactly; if you
-- change one, change the other, or the confidence gate silently drifts.
do $$ begin
  create type evidence_kind as enum ('structured', 'labelled', 'prose', 'inferred');
exception when duplicate_object then null; end $$;

-- The vocabulary the frontend already speaks (src/lib/program-schema.ts).
do $$ begin
  create type site_confidence as enum ('confirmed', 'estimated', 'unposted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type program_state as enum ('active', 'archived', 'next-cycle', 'draft');
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_state as enum ('auto-published', 'pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;


-- ================================================================ programs ==
-- One row per opportunity. This is what the site renders.
create table if not exists programs (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,

  -- Identity. `fingerprint` is normalized_title|normalized_org|registrable_domain
  -- and is the dedupe key. Unique, because two rows with the same fingerprint
  -- are by definition the same program.
  fingerprint         text unique not null,

  title               text not null,
  organization        text not null,
  category            text not null,
  summary             text not null default '',
  eligibility         text,

  -- Grades 9-12. A CHECK rather than an enum so the array stays easy to query.
  grade_levels        smallint[] not null default '{}',
  constraint grade_levels_valid
    check (grade_levels <@ array[9,10,11,12]::smallint[]),

  -- ---- the four dates -----------------------------------------------------
  -- Each carries its own evidence. A date with no evidence column set is a bug
  -- in the writer, not a legitimate state, hence the paired constraints below:
  -- a date is either absent, or present WITH a record of how we know it.
  app_open_date          date,
  app_open_evidence      evidence_kind,
  app_open_quote         text,

  app_deadline           date,
  app_deadline_evidence  evidence_kind,
  app_deadline_quote     text,

  program_start_date     date,
  program_start_evidence evidence_kind,
  program_start_quote    text,

  program_end_date       date,
  program_end_evidence   evidence_kind,
  program_end_quote      text,

  constraint app_open_evidenced
    check ((app_open_date is null) = (app_open_evidence is null)),
  constraint app_deadline_evidenced
    check ((app_deadline is null) = (app_deadline_evidence is null)),
  constraint program_start_evidenced
    check ((program_start_date is null) = (program_start_evidence is null)),
  constraint program_end_evidenced
    check ((program_end_date is null) = (program_end_evidence is null)),

  -- Ordering is advisory, not enforced: organisers really do publish
  -- contradictory dates, and refusing the row would mean dropping a real
  -- program. The engine records the contradiction in review_notes instead.
  rolling             boolean not null default false,

  -- ---- practical detail ---------------------------------------------------
  cost                cost_type not null default 'Unknown',
  cost_note           text,
  location            location_type not null default 'Unknown',
  location_note       text,
  essay_prompts       text[] not null default '{}',
  required_documents  text[] not null default '{}',

  application_link    text,
  source_url          text not null,
  source_domain       text not null,

  -- ---- trust and lifecycle ------------------------------------------------
  confidence          site_confidence not null default 'unposted',
  confidence_score    smallint not null default 0
                        check (confidence_score between 0 and 100),
  state               program_state not null default 'draft',
  is_active           boolean generated always as (state = 'active') stored,

  last_verified_at    timestamptz,
  last_seen_at        timestamptz,
  content_hash        text,
  link_status         smallint,
  link_failures       smallint not null default 0,

  review_notes        text[] not null default '{}',

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on column programs.fingerprint is
  'normalize(title)|normalize(org)|registrable_domain — the dedupe key. See scripts/engine/dedupe.mts.';
comment on column programs.app_deadline_quote is
  'Verbatim sentence from the source page. Shown to reviewers; never rendered to students.';
comment on column programs.state is
  'archived = cycle over or page gone (kept for the timeline); next-cycle = expected to reopen.';

create index if not exists programs_state_deadline_idx
  on programs (state, app_deadline) where state = 'active';
create index if not exists programs_deadline_idx
  on programs (app_deadline) where app_deadline is not null;
create index if not exists programs_domain_idx on programs (source_domain);
create index if not exists programs_grades_idx on programs using gin (grade_levels);
create index if not exists programs_title_trgm_idx on programs using gin (title gin_trgm_ops);
create index if not exists programs_stale_idx on programs (last_verified_at nulls first);


-- ========================================================= scraped_sources ==
-- One row per URL the engine knows about: seed hubs, program pages, and
-- candidates it decided not to keep. Keeping the rejects is what stops the
-- crawler paying to re-triage the same non-program page every week.
create table if not exists scraped_sources (
  id               uuid primary key default gen_random_uuid(),
  url              text unique not null,
  domain           text not null,

  kind             text not null default 'page'
                     check (kind in ('seed-hub', 'page', 'candidate', 'rejected')),
  discovered_via   text,                       -- 'hub:uoft-outreach', 'search:brave', 'manual'
  program_id       uuid references programs (id) on delete set null,

  -- Change detection. If content_hash is unchanged we skip the LLM entirely,
  -- which is where nearly all of the cost saving in this pipeline comes from.
  content_hash     text,
  last_status      smallint,
  last_crawled_at  timestamptz,
  last_changed_at  timestamptz,

  -- Politeness and back-off.
  robots_allowed   boolean not null default true,
  crawl_delay_ms   integer,
  consecutive_failures smallint not null default 0,
  -- Exponential back-off: don't hammer a host that keeps failing.
  next_crawl_after timestamptz not null default now(),

  triage_verdict   text check (triage_verdict in ('program', 'listing', 'other')),
  triage_reason    text,

  created_at       timestamptz not null default now()
);

create index if not exists scraped_sources_due_idx
  on scraped_sources (next_crawl_after) where kind in ('page', 'seed-hub');
create index if not exists scraped_sources_program_idx on scraped_sources (program_id);
create index if not exists scraped_sources_domain_idx on scraped_sources (domain);


-- ============================================================= update_logs ==
-- Append-only. Every field the engine proposed changing, whether or not it was
-- applied, and who decided. This is the audit trail that lets you answer "why
-- does this listing say March 1?" six months later — which is a question
-- somebody WILL ask, probably a parent, probably at a bad moment.
create table if not exists update_logs (
  id              bigserial primary key,
  run_id          text not null,
  program_id      uuid references programs (id) on delete cascade,
  source_url      text,

  field           text not null,
  old_value       jsonb,
  new_value       jsonb,
  evidence        evidence_kind,
  quote           text,

  confidence_score smallint,
  -- 'auto-published' only ever appears for non-date fields. If you ever see it
  -- on a *_date row, the gate in scripts/engine/confidence.mts has regressed.
  review          review_state not null default 'pending',
  reviewer        text,
  reviewed_at     timestamptz,
  reason          text,

  created_at      timestamptz not null default now()
);

create index if not exists update_logs_pending_idx
  on update_logs (review, created_at desc) where review = 'pending';
create index if not exists update_logs_program_idx on update_logs (program_id, created_at desc);
create index if not exists update_logs_run_idx on update_logs (run_id);

-- Enforce the trust rule in the database as well as in the application. Belt
-- and braces: a future script with a bug should not be able to quietly
-- auto-publish a deadline.
create or replace function reject_auto_published_dates() returns trigger
language plpgsql as $$
begin
  if new.review = 'auto-published'
     and new.field in ('app_open_date','app_deadline','program_start_date','program_end_date') then
    raise exception
      'Dates may not be auto-published (field %). A human must approve every date change.', new.field;
  end if;
  return new;
end $$;

drop trigger if exists update_logs_no_auto_dates on update_logs;
create trigger update_logs_no_auto_dates
  before insert or update on update_logs
  for each row execute function reject_auto_published_dates();


-- ------------------------------------------------------------ updated_at ---
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists programs_touch on programs;
create trigger programs_touch before update on programs
  for each row execute function touch_updated_at();


-- ------------------------------------------------- the review queue view ---
create or replace view review_queue as
select
  l.id,
  l.run_id,
  l.field,
  l.old_value,
  l.new_value,
  l.evidence,
  l.quote,
  l.confidence_score,
  l.reason,
  l.created_at,
  p.id   as program_id,
  p.slug,
  p.title,
  p.organization,
  p.source_url,
  (l.field like '%date%' or l.field = 'app_deadline') as is_date_change
from update_logs l
left join programs p on p.id = l.program_id
where l.review = 'pending'
order by
  (l.field like '%date%' or l.field = 'app_deadline') desc,  -- dates first
  l.created_at desc;


-- --------------------------------------------------- row level security ----
-- Students read; nobody writes without the service role. The engine runs in CI
-- with the service key; /admin/review uses an authenticated session.
alter table programs         enable row level security;
alter table scraped_sources  enable row level security;
alter table update_logs      enable row level security;

drop policy if exists programs_public_read on programs;
create policy programs_public_read on programs
  for select using (state = 'active');

drop policy if exists programs_admin_all on programs;
create policy programs_admin_all on programs
  for all to authenticated using (true) with check (true);

drop policy if exists sources_admin_only on scraped_sources;
create policy sources_admin_only on scraped_sources
  for all to authenticated using (true) with check (true);

drop policy if exists logs_admin_read on update_logs;
create policy logs_admin_read on update_logs
  for select to authenticated using (true);

drop policy if exists logs_admin_write on update_logs;
create policy logs_admin_write on update_logs
  for update to authenticated using (true) with check (true);


-- ------------------------------------------------------- staleness helper --
-- "Which listings has nobody checked lately?" — the query the freshness job
-- and the counsellor dashboard both want.
create or replace function stale_programs(max_age_days integer default 45)
returns setof programs language sql stable as $$
  select * from programs
  where state = 'active'
    and (last_verified_at is null or last_verified_at < now() - make_interval(days => max_age_days))
  order by last_verified_at nulls first;
$$;


-- ------------------------------------------------------------- pg_cron -----
-- Optional. Only useful once the engine writes here rather than to git; until
-- then the schedule lives in .github/workflows/sync-programs.yml.
--
-- create extension if not exists pg_cron;
-- select cron.schedule('link-health', '0 11 * * *',
--   $$ select net.http_get(url := 'https://<project>.functions.supabase.co/link-health') $$);
-- select cron.schedule('weekly-crawl', '0 12 * * 1',
--   $$ select net.http_post(url := 'https://<project>.functions.supabase.co/crawl') $$);
