import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ year?: string }>;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const year = Number(sp.year) || new Date().getFullYear();
  const supabase = await createClient();

  const { data: letters } = await supabase
    .from("letters")
    .select("direction, letter_date, category_id")
    .is("deleted_at", null)
    .gte("letter_date", `${year}-01-01`)
    .lte("letter_date", `${year}-12-31`);

  const { data: categories } = await supabase
    .from("letter_categories")
    .select("id, name");

  const catName = (id: string | null) =>
    categories?.find((c) => c.id === id)?.name ?? "Tanpa Kategori";

  const monthly = MONTHS.map(() => ({ masuk: 0, keluar: 0 }));
  const perCategory: Record<string, number> = {};
  let totalMasuk = 0;
  let totalKeluar = 0;

  for (const l of letters ?? []) {
    const m = new Date(l.letter_date).getMonth();
    if (l.direction === "masuk") {
      monthly[m].masuk++;
      totalMasuk++;
    } else {
      monthly[m].keluar++;
      totalKeluar++;
      const key = catName(l.category_id);
      perCategory[key] = (perCategory[key] ?? 0) + 1;
    }
  }

  const maxMonthly = Math.max(
    1,
    ...monthly.map((m) => Math.max(m.masuk, m.keluar))
  );
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Laporan</h1>
        <form className="flex items-center gap-2">
          <select name="year" defaultValue={String(year)} className="input">
            {years.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Tampilkan
          </button>
        </form>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Total Surat Masuk" value={totalMasuk} />
        <Card label="Total Surat Keluar" value={totalKeluar} />
        <Card label="Total Surat" value={totalMasuk + totalKeluar} />
      </div>

      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Rekap Bulanan {year}
        </h2>
        <div className="space-y-2">
          {monthly.map((m, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="w-8 text-slate-500">{MONTHS[i]}</span>
              <div className="flex flex-1 flex-col gap-1">
                <Bar value={m.masuk} max={maxMonthly} color="bg-blue-500" label="Masuk" />
                <Bar value={m.keluar} max={maxMonthly} color="bg-emerald-500" label="Keluar" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-blue-500" /> Masuk
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-emerald-500" /> Keluar
          </span>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Rekap Surat Keluar per Kategori
        </h2>
        {Object.keys(perCategory).length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada data.</p>
        ) : (
          <table className="min-w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {Object.entries(perCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => (
                  <tr key={name}>
                    <td className="py-2 text-slate-700">{name}</td>
                    <td className="py-2 text-right font-medium text-slate-900">
                      {count}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Bar({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 flex-1 rounded bg-slate-100">
        <div
          className={`h-3 rounded ${color}`}
          style={{ width: `${value === 0 ? 0 : Math.max(pct, 4)}%` }}
          title={`${label}: ${value}`}
        />
      </div>
      <span className="w-6 text-right text-slate-600">{value}</span>
    </div>
  );
}
