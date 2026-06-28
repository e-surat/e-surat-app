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
