import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES } from "@/lib/roles";
import AddUserForm from "./AddUserForm";
import UserRow from "./UserRow";

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
  if (!ADMIN_ROLES.includes(me?.role ?? "")) redirect("/dashboard");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, divisions(name)")
    .order("full_name", { ascending: true });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Pengaturan</h1>
      <p className="mb-5 text-sm text-slate-500">
        Kelola pengguna & role sistem e-Surat.
      </p>

      <h2 className="mb-2 text-sm font-semibold text-slate-700">Tambah User</h2>
      <AddUserForm />

      <h2 className="mb-2 text-sm font-semibold text-slate-700">Daftar Pengguna</h2>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama &amp; Role</th>
              <th className="px-4 py-3">Divisi</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(profiles ?? []).map((p) => {
              const division = Array.isArray(p.divisions)
                ? p.divisions[0]?.name
                : (p.divisions as { name?: string } | null)?.name;
              return (
                <UserRow
                  key={p.id}
                  id={p.id}
                  fullName={p.full_name ?? ""}
                  role={p.role}
                  division={division ?? "-"}
                  isSelf={p.id === user.id}
                />
              );
            })}
            {(!profiles || profiles.length === 0) && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
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
