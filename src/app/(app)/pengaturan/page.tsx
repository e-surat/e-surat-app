import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateRole } from "./actions";

const ROLES = ["admin", "pimpinan", "staf"];

export default async function PengaturanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/dashboard");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, divisions(name)")
    .order("full_name", { ascending: true });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Pengaturan</h1>
      <p className="mb-5 text-sm text-slate-500">
        Kelola role pengguna sistem e-Surat.
      </p>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Divisi</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(profiles ?? []).map((p) => {
              const division = Array.isArray(p.divisions)
                ? p.divisions[0]?.name
                : (p.divisions as { name?: string } | null)?.name;
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {p.full_name ?? "(tanpa nama)"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{division ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                      {p.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateRole} className="flex items-center gap-2">
                      <input type="hidden" name="user_id" value={p.id} />
                      <select
                        name="role"
                        defaultValue={p.role}
                        className="input w-32"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                        Simpan
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {(!profiles || profiles.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Belum ada pengguna.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
