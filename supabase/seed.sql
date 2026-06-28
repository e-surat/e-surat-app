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
