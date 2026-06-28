import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES } from "@/lib/roles";

function fmt(date: string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AuditPage() {
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

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, action, entity, entity_id, meta, created_at, actor:actor_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Audit Trail</h1>
      <p className="mb-5 text-sm text-slate-500">
        Log aktivitas & jejak digital sistem (100 terbaru).
      </p>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Aktor</th>
              <th className="px-4 py-3">Aksi</th>
              <th className="px-4 py-3">Entitas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(logs ?? []).map((l) => {
              const actor = Array.isArray(l.actor)
                ? l.actor[0]?.full_name
                : (l.actor as { full_name?: string } | null)?.full_name;
              return (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {fmt(l.created_at)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{actor ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{l.action}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {l.entity ?? "-"}
                  </td>
                </tr>
              );
            })}
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Belum ada aktivitas tercatat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
