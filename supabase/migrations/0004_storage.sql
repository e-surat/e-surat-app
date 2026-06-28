-- M2 - 0004: Storage bucket untuk file surat (PDF/scan)

insert into storage.buckets (id, name, public)
values ('surat', 'surat', false)
on conflict (id) do nothing;

-- Baca: semua user terautentikasi
drop policy if exists "surat_read" on storage.objects;
create policy "surat_read" on storage.objects for select
  using (bucket_id = 'surat' and auth.uid() is not null);

-- Tulis/ubah/hapus: admin & pimpinan
drop policy if exists "surat_insert" on storage.objects;
create policy "surat_insert" on storage.objects for insert
  with check (bucket_id = 'surat' and public.my_role() in ('admin', 'pimpinan'));

drop policy if exists "surat_update" on storage.objects;
create policy "surat_update" on storage.objects for update
  using (bucket_id = 'surat' and public.my_role() in ('admin', 'pimpinan'));

drop policy if exists "surat_delete" on storage.objects;
create policy "surat_delete" on storage.objects for delete
  using (bucket_id = 'surat' and public.my_role() = 'admin');
