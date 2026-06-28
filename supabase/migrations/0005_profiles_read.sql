-- M4 - 0005: izinkan semua user terautentikasi membaca profil
-- (dibutuhkan untuk memilih tujuan disposisi & menampilkan nama)

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (auth.uid() is not null);
