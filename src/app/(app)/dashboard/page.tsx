import { createClient } from "@/lib/supabase/server";
import { classifyLetter, LETTER_TYPES } from "@/lib/letterType";
import DashboardCharts from "./DashboardCharts";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let greetingName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    greetingName = profile?.full_name ?? user.email ?? "";
  }

  const [masuk, keluar, disposisi] = await Promise.all([
    supabase
      .from("letters")
      .select("id", { count: "exact", head: true })
      .eq("direction", "masuk")
      .is("deleted_at", null),
    supabase
      .from("letters")
      .select("id", { count: "exact", head: true })
      .eq("direction", "keluar")
      .is("deleted_at", null),
    supabase
      .from("dispositions")
      .select("id", { count: "exact", head: true })
      .neq("status", "selesai"),
  ]);

  const stats = [
    { label: "Surat Masuk", value: masuk.count ?? 0 },
    { label: "Surat Keluar", value: keluar.count ?? 0 },
    { label: "Disposisi Aktif", value: disposisi.count ?? 0 },
  ];

  const { data: allLetters } = await supabase
    .from("letters")
    .select("direction, letter_date, subject")
    .is("deleted_at", null);

  const yearMap = new Map<string, { masuk: number; keluar: number }>();
  const typeMatrix = new Map<string, Map<string, number>>();
  const yearsSet = new Set<string>();

  for (const l of allLetters ?? []) {
    const year = (l.letter_date ?? "").slice(0, 4) || "?";
    yearsSet.add(year);
    const y = yearMap.get(year) ?? { masuk: 0, keluar: 0 };
    if (l.direction === "masuk") y.masuk++;
    else if (l.direction === "keluar") y.keluar++;
    yearMap.set(year, y);

    const jenis = classifyLetter(l.subject);
    const tm = typeMatrix.get(jenis) ?? new Map<string, number>();
    tm.set(year, (tm.get(year) ?? 0) + 1);
    typeMatrix.set(jenis, tm);
  }

  const years = [...yearsSet].sort();
  const perYear = years.map((y) => ({
    year: y,
    masuk: yearMap.get(y)?.masuk ?? 0,
    keluar: yearMap.get(y)?.keluar ?? 0,
  }));

  const typeRows = LETTER_TYPES.map((t) => {
    const tm = typeMatrix.get(t);
    const counts = years.map((y) => tm?.get(y) ?? 0);
    const total = counts.reduce((a, b) => a + b, 0);
    return { type: t, counts, total };
  }).filter((r) => r.total > 0);

  const yearTotals = years.map((_, i) =>
    typeRows.reduce((sum, r) => sum + r.counts[i], 0)
  );
  const grandTotal = yearTotals.reduce((a, b) => a + b, 0);

  const workflow = [
    {
      title: "Surat Masuk",
      desc: "Admin/TU mencatat & mengunggah surat",
    },
    {
      title: "Disposisi",
      desc: "Pimpinan meneruskan ke staf/divisi",
    },
    {
      title: "Tindak Lanjut",
      desc: "Staf menindaklanjuti instruksi",
    },
    {
      title: "Selesai",
      desc: "Disposisi ditandai selesai",
    },
    {
      title: "Arsip",
      desc: "Surat tersimpan & dapat dicari",
    },
  ];

  return (
    <div>
      <div className="mb-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-semibold">
          Hallo{greetingName ? `, ${greetingName}` : ""} 👋
        </h1>
        <p className="mt-1 text-slate-200">
          Selamat datang di e-Surat Yayasan JaRI
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Alur Proses Surat
        </h2>
        <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-0">
          {workflow.map((w, i) => (
            <div key={w.title} className="flex flex-1 items-stretch">
              <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {i + 1}
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {w.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">{w.desc}</p>
              </div>
              {i < workflow.length - 1 && (
                <div className="flex items-center justify-center px-1 text-slate-300">
                  <span className="hidden md:inline">→</span>
                  <span className="md:hidden">↓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Analisis Surat
        </h2>
        <DashboardCharts perYear={perYear} pies={perYear} />

        <div className="mt-4 overflow-x-auto rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Jumlah Surat per Jenis & Tahun
          </h3>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Jenis Surat</th>
                {years.map((y) => (
                  <th key={y} className="px-4 py-3 text-right">
                    {y}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {typeRows.map((r) => (
                <tr key={r.type} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {r.type}
                  </td>
                  {r.counts.map((c, i) => (
                    <td key={i} className="px-4 py-3 text-right text-slate-600">
                      {c}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {r.total}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
                <td className="px-4 py-3">Total</td>
                {yearTotals.map((t, i) => (
                  <td key={i} className="px-4 py-3 text-right">
                    {t}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">{grandTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
