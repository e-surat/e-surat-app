import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const isAdmin = profile?.role === "admin";
  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    pimpinan: "Pimpinan",
    staf: "Staf",
  };
  const roleLabel = roleLabels[profile?.role ?? "staf"] ?? "Staf";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <MobileNav isAdmin={isAdmin} />
          <div className="ml-auto flex items-center gap-4">
            <NotificationBell />
            <div className="text-right text-sm leading-tight">
              <p className="font-semibold text-slate-900">
                {profile?.full_name ?? user.email}
              </p>
              <p className="text-xs text-indigo-500">{roleLabel}</p>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
