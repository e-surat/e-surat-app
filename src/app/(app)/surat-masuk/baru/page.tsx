import Link from "next/link";
import { createSuratMasuk } from "../actions";

export default function TambahSuratMasukPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/surat-masuk"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          &larr; Kembali
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">
          Tambah Surat Masuk
        </h1>
      </div>

      <form
        action={createSuratMasuk}
        className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <Field label="Tanggal Surat" required>
          <input
            type="date"
            name="letter_date"
            required
            className="input"
          />
        </Field>

        <Field label="No Surat Masuk" required>
          <input
            type="text"
            name="letter_number"
            required
            placeholder="contoh: 109/UN2.F9/PPM/2023"
            className="input"
          />
        </Field>

        <Field label="Alamat Pengirim" required>
          <input
            type="text"
            name="counterpart"
            required
            placeholder="contoh: Polresta Bandung"
            className="input"
          />
        </Field>

        <Field label="Perihal" required>
          <textarea name="subject" required rows={3} className="input" />
        </Field>

        <Field label="File Surat (PDF/gambar, opsional)">
          <input
            type="file"
            name="file"
            accept=".pdf,image/*"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            href="/surat-masuk"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Batal
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
