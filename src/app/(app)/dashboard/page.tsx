import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

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

  return (
    <div>
      <h1 className="mb-5 text-xl font-semibold text-slate-900">Dashboard</h1>
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
    </div>
  );
}
