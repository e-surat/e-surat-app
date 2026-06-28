import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_ROLES } from "@/lib/roles";
import AddUserForm from "./AddUserForm";
import UsersTable, { type UserRowData } from "./UsersTable";

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

  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, role, is_active, updated_at")
    .order("full_name", { ascending: true });

  const { data: authList } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const authMap = new Map(
    (authList?.users ?? []).map((u) => [
      u.id,
      { email: u.email ?? "-", lastLogin: u.last_sign_in_at ?? null },
    ])
  );

  const users: UserRowData[] = (profiles ?? []).map((p) => {
    const auth = authMap.get(p.id);
    return {
      id: p.id,
      fullName: p.full_name ?? "",
      email: auth?.email ?? "-",
      role: p.role,
      isActive: p.is_active ?? true,
      lastLogin: auth?.lastLogin ?? null,
      lastActive: p.updated_at ?? null,
    };
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Pengaturan</h1>
      <p className="mb-5 text-sm text-slate-500">
        Kelola pengguna & role sistem e-Surat.
      </p>

      <h2 className="mb-2 text-sm font-semibold text-slate-700">Tambah User</h2>
      <AddUserForm />

      <h2 className="mb-2 text-sm font-semibold text-slate-700">Daftar Pengguna</h2>
      <UsersTable users={users} currentUserId={user.id} />
    </div>
  );
}
