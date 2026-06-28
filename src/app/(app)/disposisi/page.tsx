import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateDispositionStatus } from "./actions";

export default async function DisposisiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: incoming }, { data: outgoing }] = await Promise.all([
    supabase
      .from("dispositions")
      .select("id, instruction, status, due_date, letter_id, letters(subject, letter_number)")
      .eq("to_user", user?.id ?? "")
      .order("created_at", { ascending: false }),
    supabase
      .from("dispositions")
      .select("id, instruction, status, due_date, letter_id, letters(subject, letter_number)")
      .eq("from_user", user?.id ?? "")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 text-xl font-semibold text-slate-900">
          Disposisi untuk Saya
        </h1>
        <DispoList rows={(incoming ?? []) as unknown as Row[]} actionable />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Disposisi yang Saya Kirim
        </h2>
        <DispoList rows={(outgoing ?? []) as unknown as Row[]} />
      </section>
    </div>
  );
}

type Row = {
  id: string;
  instruction: string | null;
  status: string;
  due_date: string | null;
  letter_id: string | null;
  letters: { subject: string; letter_number: string } | null;
};

function DispoList({ rows, actionable }: { rows: Row[]; actionable?: boolean }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">Tidak ada disposisi.</p>;
  }
  return (
    <ul className="space-y-3">
      {rows.map((d) => (
        <li
          key={d.id}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              {d.letter_id ? (
                <Link
                  href={`/surat/${d.letter_id}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {d.letters?.subject ?? "Surat"}
                </Link>
              ) : (
                <span className="font-medium text-slate-900">
                  {d.letters?.subject ?? "Surat"}
                </span>
              )}
              <p className="text-xs text-slate-400">{d.letters?.letter_number}</p>
              {d.instruction && (
                <p className="mt-1 text-sm text-slate-600">{d.instruction}</p>
              )}
              {d.due_date && (
                <p className="mt-1 text-xs text-slate-400">Tenggat: {d.due_date}</p>
              )}
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
              {d.status}
            </span>
          </div>

          {actionable && d.status !== "selesai" && (
            <div className="mt-3 flex gap-2">
              {d.status === "menunggu" && (
                <form action={updateDispositionStatus}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="status" value="dibaca" />
                  <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                    Tandai Dibaca
                  </button>
                </form>
              )}
              <form action={updateDispositionStatus}>
                <input type="hidden" name="id" value={d.id} />
                <input type="hidden" name="status" value="selesai" />
                <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                  Tandai Selesai
                </button>
              </form>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
