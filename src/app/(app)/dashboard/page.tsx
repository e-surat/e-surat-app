import { createClient } from "@/lib/supabase/server";

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
    </div>
  );
}
