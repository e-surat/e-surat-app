-- e-Surat Yayasan JaRI :: Skema dasar
-- M1 - 0001: extensions, enums, tabel inti, index, trigger dasar

create extension if not exists pgcrypto;

-- ENUMS -----------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'pimpinan', 'staf');
exception when duplicate_object then null; end $$;

do $$ begin
  create type letter_direction as enum ('masuk', 'keluar');
exception when duplicate_object then null; end $$;

do $$ begin
  create type letter_status as enum ('draft', 'diproses', 'didisposisikan', 'selesai', 'diarsipkan');
exception when duplicate_object then null; end $$;

do $$ begin
  create type disposition_status as enum ('menunggu', 'dibaca', 'selesai');
exception when duplicate_object then null; end $$;

-- TRIGGER updated_at ----------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- DIVISIONS -------------------------------------------------------------
create table if not exists divisions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_divisions_updated before update on divisions
  for each row execute function set_updated_at();

-- PROFILES (extends auth.users) -----------------------------------------
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  role         user_role not null default 'staf',
  division_id  uuid references divisions(id) on delete set null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_profiles_division on profiles(division_id);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- LETTER CATEGORIES (klasifikasi + kode penomoran, mis. 'B') ------------
create table if not exists letter_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  code         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_categories_updated before update on letter_categories
  for each row execute function set_updated_at();

-- COUNTERS (untuk nomor agenda & nomor surat keluar, atomik) ------------
create table if not exists counters (
  id             uuid primary key default gen_random_uuid(),
  scope          text not null,
  year           int  not null,
  current_value  int  not null default 0,
  unique (scope, year)
);

-- LETTERS ---------------------------------------------------------------
create table if not exists letters (
  id             uuid primary key default gen_random_uuid(),
  agenda_number  int not null,
  direction      letter_direction not null,
  letter_number  text not null,
  category_id    uuid references letter_categories(id) on delete set null,
  letter_date    date not null,
  counterpart    text not null,
  subject        text not null,
  status         letter_status not null default 'diproses',
  created_by     uuid references profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index if not exists idx_letters_direction on letters(direction);
create index if not exists idx_letters_date on letters(letter_date);
create index if not exists idx_letters_category on letters(category_id);
create index if not exists idx_letters_search on letters
  using gin (to_tsvector('simple', coalesce(subject,'') || ' ' || coalesce(counterpart,'') || ' ' || coalesce(letter_number,'')));
create trigger trg_letters_updated before update on letters
  for each row execute function set_updated_at();

-- DISPOSITIONS ----------------------------------------------------------
create table if not exists dispositions (
  id           uuid primary key default gen_random_uuid(),
  letter_id    uuid not null references letters(id) on delete cascade,
  from_user    uuid references profiles(id) on delete set null,
  to_user      uuid references profiles(id) on delete set null,
  instruction  text,
  status       disposition_status not null default 'menunggu',
  due_date     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_disp_letter on dispositions(letter_id);
create index if not exists idx_disp_to on dispositions(to_user);
create trigger trg_disp_updated before update on dispositions
  for each row execute function set_updated_at();

-- ATTACHMENTS -----------------------------------------------------------
create table if not exists attachments (
  id            uuid primary key default gen_random_uuid(),
  letter_id     uuid not null references letters(id) on delete cascade,
  storage_path  text not null,
  file_name     text,
  mime_type     text,
  size_bytes    bigint,
  uploaded_by   uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_attach_letter on attachments(letter_id);

-- NOTIFICATIONS ---------------------------------------------------------
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  message     text not null,
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notif_user on notifications(user_id, is_read);

-- AUDIT LOGS ------------------------------------------------------------
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,
  entity      text,
  entity_id   uuid,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_audit_actor on audit_logs(actor_id);

-- AUTO-CREATE PROFILE saat user baru daftar -----------------------------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
