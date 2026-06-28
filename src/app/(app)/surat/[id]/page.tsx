import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createDisposition } from "../../disposisi/actions";

type Params = Promise<{ id: string }>;

export default async function SuratDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const { data: letter } = await supabase
    .from("letters")
    .select(
      "id, direction, agenda_number, letter_number, letter_date, counterpart, subject, status, category_id"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!letter) notFound();

  const [{ data: attachments }, { data: dispositions }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("attachments")
        .select("id, storage_path, file_name")
        .eq("letter_id", id),
      supabase
        .from("dispositions")
        .select("id, from_user, to_user, instruction, status, due_date, created_at")
        .eq("letter_id", id)
        .order("created_at", { ascending: true }),
      supabase.from("profiles").select("id, full_name, role").order("full_name"),
    ]);

  const nameOf = (uid: string | null) =>
    profiles?.find((p) => p.id === uid)?.full_name ?? "-";

  const signedFiles = await Promise.all(
    (attachments ?? []).map(async (a) => {
      const { data } = await supabase.storage
        .from("surat")
        .createSignedUrl(a.storage_path, 3600);
      return { ...a, url: data?.signedUrl ?? "#" };
    })
  );

  const canDispose = me?.role === "admin" || me?.role === "pimpinan";
  const backHref =
    letter.direction === "masuk" ? "/surat-masuk" : "/surat-keluar";

  return (
    <div className="max-w-3xl">
      <div className="mb-5 flex items-center gap-3">
        <Link href={backHref} className="text-sm text-slate-500 hover:text-slate-900">
          &larr; Kembali
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Detail Surat</h1>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
            <Info label="Arah">{letter.direction === "masuk" ? "Surat Masuk" : "Surat Keluar"}</Info>
            <Info label="No Agenda">{letter.agenda_number}</Info>
            <Info label="No Surat">{letter.letter_number}</Info>
            <Info label="Tanggal">{letter.letter_date}</Info>
            <Info label={letter.direction === "masuk" ? "Pengirim" : "Ditujukan Kepada"}>
              {letter.counterpart}
            </Info>
            <Info label="Status">{letter.status}</Info>
            <div className="sm:col-span-2">
              <Info label="Perihal">{letter.subject}</Info>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Lampiran</h2>
          {signedFiles.length === 0 ? (
            <p className="text-sm text-slate-400">Tidak ada lampiran.</p>
          ) : (
            <ul className="space-y-2">
              {signedFiles.map((f) => (
                <li key={f.id}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {f.file_name ?? "file"}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Disposisi</h2>
          {(dispositions ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada disposisi.</p>
          ) : (
            <ul className="space-y-3">
              {(dispositions ?? []).map((d) => (
                <li
                  key={d.id}
                  className="rounded-lg border border-slate-200 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">
                      {nameOf(d.from_user)} &rarr; {nameOf(d.to_user)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                      {d.status}
                    </span>
                  </div>
                  {d.instruction && (
                    <p className="mt-1 text-slate-600">{d.instruction}</p>
                  )}
                  {d.due_date && (
                    <p className="mt-1 text-xs text-slate-400">
                      Tenggat: {d.due_date}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canDispose && (
            <form action={createDisposition} className="mt-5 space-y-3 border-t border-slate-100 pt-4">
              <input type="hidden" name="letter_id" value={letter.id} />
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Teruskan ke
                </label>
                <select name="to_user" required className="input" defaultValue="">
                  <option value="" disabled>
                    Pilih penerima...
                  </option>
                  {(profiles ?? [])
                    .filter((p) => p.id !== user?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.role})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Instruksi
                </label>
                <textarea name="instruction" rows={2} className="input" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Tenggat (opsional)
                </label>
                <input type="date" name="due_date" className="input" />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Kirim Disposisi
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="text-slate-800">{children}</p>
    </div>
  );
}
