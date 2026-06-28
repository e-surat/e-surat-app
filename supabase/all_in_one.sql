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
-- M1 - 0002: fungsi penomoran otomatis
-- Konstanta organisasi (mudah diubah bila perlu)
--   Kode sekretariat: 'JaRI-Sekr'
--   Format surat keluar: {urut}/JaRI-Sekr/{kode_kategori}/{bulan_romawi}/{tahun}
--   Contoh: 77/JaRI-Sekr/B/VII/2023

-- Counter atomik: naikkan & kembalikan nilai berikutnya
create or replace function next_counter(p_scope text, p_year int)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_value int;
begin
  insert into counters (scope, year, current_value)
  values (p_scope, p_year, 1)
  on conflict (scope, year)
  do update set current_value = counters.current_value + 1
  returning current_value into v_value;
  return v_value;
end $$;

-- Konversi bulan (1-12) ke angka Romawi
create or replace function to_roman_month(p_month int)
returns text language sql immutable as $$
  select (array['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'])[p_month];
$$;

-- Trigger: isi agenda_number & letter_number sebelum insert
create or replace function fill_letter_numbers()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_year      int := extract(year from new.letter_date);
  v_month     int := extract(month from new.letter_date);
  v_seq       int;
  v_cat_code  text;
begin
  -- Nomor agenda internal: per arah surat, per tahun
  if new.agenda_number is null or new.agenda_number = 0 then
    new.agenda_number := next_counter('agenda_' || new.direction::text, v_year);
  end if;

  -- Nomor surat keluar otomatis bila belum diisi
  if new.direction = 'keluar'
     and (new.letter_number is null or btrim(new.letter_number) = '') then
    select code into v_cat_code from letter_categories where id = new.category_id;
    v_cat_code := coalesce(v_cat_code, 'B');
    v_seq := next_counter('nomor_keluar', v_year);
    new.letter_number :=
      v_seq || '/JaRI-Sekr/' || v_cat_code || '/' || to_roman_month(v_month) || '/' || v_year;
  end if;

  return new;
end $$;

drop trigger if exists trg_letters_numbering on letters;
create trigger trg_letters_numbering
  before insert on letters
  for each row execute function fill_letter_numbers();
-- M1 - 0003: Row Level Security + policy per role

-- Helper: role user saat ini
create or replace function my_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- Aktifkan RLS
alter table profiles         enable row level security;
alter table divisions        enable row level security;
alter table letter_categories enable row level security;
alter table letters          enable row level security;
alter table dispositions     enable row level security;
alter table attachments      enable row level security;
alter table notifications    enable row level security;
alter table audit_logs       enable row level security;

-- PROFILES
create policy profiles_select on profiles for select
  using (id = auth.uid() or is_admin());
create policy profiles_update_self on profiles for update
  using (id = auth.uid() or is_admin());
create policy profiles_admin_write on profiles for all
  using (is_admin()) with check (is_admin());

-- DIVISIONS (semua auth baca; admin kelola)
create policy divisions_select on divisions for select
  using (auth.uid() is not null);
create policy divisions_admin on divisions for all
  using (is_admin()) with check (is_admin());

-- LETTER CATEGORIES
create policy categories_select on letter_categories for select
  using (auth.uid() is not null);
create policy categories_admin on letter_categories for all
  using (is_admin()) with check (is_admin());

-- LETTERS (semua auth baca; admin & pimpinan tulis)
create policy letters_select on letters for select
  using (auth.uid() is not null);
create policy letters_insert on letters for insert
  with check (my_role() in ('admin', 'pimpinan'));
create policy letters_update on letters for update
  using (my_role() in ('admin', 'pimpinan'));
create policy letters_delete on letters for delete
  using (is_admin());

-- DISPOSITIONS (terlibat / admin / pimpinan boleh baca)
create policy disp_select on dispositions for select
  using (
    is_admin()
    or my_role() = 'pimpinan'
    or from_user = auth.uid()
    or to_user = auth.uid()
  );
create policy disp_insert on dispositions for insert
  with check (my_role() in ('admin', 'pimpinan'));
create policy disp_update on dispositions for update
  using (is_admin() or my_role() = 'pimpinan' or to_user = auth.uid());

-- ATTACHMENTS (ikut akses surat)
create policy attach_select on attachments for select
  using (auth.uid() is not null);
create policy attach_write on attachments for all
  using (my_role() in ('admin', 'pimpinan'))
  with check (my_role() in ('admin', 'pimpinan'));

-- NOTIFICATIONS (milik sendiri)
create policy notif_select on notifications for select
  using (user_id = auth.uid());
create policy notif_update on notifications for update
  using (user_id = auth.uid());

-- AUDIT LOGS (admin baca)
create policy audit_select on audit_logs for select
  using (is_admin());
-- M1 - seed data awal e-Surat Yayasan JaRI

insert into divisions (name, code) values
  ('Sekretariat', 'SEKR'),
  ('Layanan & Pendampingan', 'LAY'),
  ('Program', 'PRG'),
  ('Keuangan', 'KEU')
on conflict (code) do nothing;

-- Kategori/klasifikasi surat (code dipakai pada nomor surat keluar)
insert into letter_categories (name, code) values
  ('Surat Biasa', 'B'),
  ('Surat Keputusan', 'SK'),
  ('Surat Tugas', 'ST'),
  ('Undangan', 'U'),
  ('Keuangan/Invoice', 'KEU')
on conflict do nothing;
