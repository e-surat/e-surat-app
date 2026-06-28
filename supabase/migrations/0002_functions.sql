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
