-- LANGKAH 1: tambah nilai enum role baru.
-- Jalankan file ini DULU (klik Run), baru jalankan 0007_roles_step2.sql.
alter type user_role add value if not exists 'super_admin';
alter type user_role add value if not exists 'officer';
alter type user_role add value if not exists 'auditor';
alter type user_role add value if not exists 'ketua';
alter type user_role add value if not exists 'viewer';
