import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  q?: string;
  direction?: string;
  status?: string;
  from?: string;
  to?: string;
}>;

const STATUSES = [
  "draft",
  "diproses",
  "didisposisikan",
  "selesai",
  "diarsipkan",
];

export default async function ArsipPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("letters")
    .select(
      "id, agenda_number, direction, letter_number, letter_date, counterpart, subject, status"
    )
    .is("deleted_at", null)
    .order("letter_date", { ascending: false });

  if (sp.q) {
    query = query.or(
      `subject.ilike.%${sp.q}%,counterpart.ilike.%${sp.q}%,letter_number.ilike.%${sp.q}%`
    );
  }
  if (sp.direction === "masuk" || sp.direction === "keluar") {
    query = query.eq("direction", sp.direction);
  }
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.from) query = query.gte("letter_date", sp.from);
  if (sp.to) query = query.lte("letter_date", sp.to);

  const { data: letters } = await query;

  const exportQs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][]
  ).toString();

  const years = [2023, 2024, 2025, 2026];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Arsip Surat</h1>
        <a
          href={`/api/export?${exportQs}`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Export CSV
        </a>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/arsip"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            !sp.from
              ? "bg-slate-900 text-white"
              : "border border-slate-300 text-slate-700 hover:bg-slate-100"
          }`}
        >
          Semua
        </Link>
        {years.map((y) => {
          const active = sp.from === `${y}-01-01`;
          return (
            <Link
              key={y}
              href={`/arsip?from=${y}-01-01&to=${y}-12-31`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                active
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {y}
            </Link>
          );
        })}
      </div>

      <form className="mb-4 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-5">
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Cari..."
          className="input sm:col-span-2"
        />
        <select name="direction" defaultValue={sp.direction ?? ""} className="input">
          <option value="">Semua arah</option>
          <option value="masuk">Surat Masuk</option>
          <option value="keluar">Surat Keluar</option>
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="input">
          <option value="">Semua status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          Filter
        </button>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input type="date" name="from" defaultValue={sp.from ?? ""} className="input" />
          <span className="text-sm text-slate-400">s/d</span>
          <input type="date" name="to" defaultValue={sp.to ?? ""} className="input" />
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Arah</th>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Tgl</th>
              <th className="px-4 py-3">No Surat</th>
              <th className="px-4 py-3">Pihak</th>
              <th className="px-4 py-3">Perihal</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(letters ?? []).map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                    {l.direction}
                  </span>
                </td>
                <td className="px-4 py-3">{l.agenda_number}</td>
                <td className="px-4 py-3 whitespace-nowrap">{l.letter_date}</td>
                <td className="px-4 py-3">{l.letter_number}</td>
                <td className="px-4 py-3">{l.counterpart}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/surat/${l.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {l.subject}
                  </Link>
                </td>
                <td className="px-4 py-3">{l.status}</td>
              </tr>
            ))}
            {(!letters || letters.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Tidak ada data sesuai filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
