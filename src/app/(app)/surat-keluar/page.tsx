import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ q?: string }>;

export default async function SuratKeluarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("letters")
    .select("id, agenda_number, letter_number, letter_date, counterpart, subject, status")
    .eq("direction", "keluar")
    .is("deleted_at", null)
    .order("letter_date", { ascending: false });

  if (q) {
    query = query.or(
      `subject.ilike.%${q}%,counterpart.ilike.%${q}%,letter_number.ilike.%${q}%`
    );
  }

  const { data: letters } = await query;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Surat Keluar</h1>
        <Link
          href="/surat-keluar/baru"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          + Tambah
        </Link>
      </div>

      <form className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari perihal / tujuan / nomor surat..."
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
      </form>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Tgl Surat</th>
              <th className="px-4 py-3">No Surat</th>
              <th className="px-4 py-3">Ditujukan Kepada</th>
              <th className="px-4 py-3">Perihal</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(letters ?? []).map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">{l.agenda_number}</td>
                <td className="px-4 py-3 whitespace-nowrap">{l.letter_date}</td>
                <td className="px-4 py-3 whitespace-nowrap font-medium">
                  {l.letter_number}
                </td>
                <td className="px-4 py-3">{l.counterpart}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/surat/${l.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {l.subject}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                    {l.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!letters || letters.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Belum ada data surat keluar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
