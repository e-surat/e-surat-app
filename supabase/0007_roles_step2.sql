-- LANGKAH 2: jalankan SETELAH 0006_roles_step1.sql sukses.

-- Petakan role lama ke role baru
update public.profiles set role = 'ketua'   where role = 'pimpinan';
update public.profiles set role = 'officer' where role = 'staf';

-- Default role untuk pendaftaran baru: paling rendah (viewer)
alter table public.profiles alter column role set default 'viewer';

-- Akses penuh: admin & super_admin
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role in ('admin', 'super_admin') from public.profiles where id = auth.uid()),
    false
  );
$$;
