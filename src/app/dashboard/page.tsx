import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">e-Surat</h1>
          <p className="text-xs text-slate-500">Yayasan JaRI</p>
        </div>
        <LogoutButton />
      </header>

      <section className="p-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Selamat datang{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Email: {user.email}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Role: {profile?.role ?? "belum diatur"}
          </p>
        </div>
      </section>
    </main>
  );
}
