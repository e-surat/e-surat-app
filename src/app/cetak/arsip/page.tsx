import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintActions from "./PrintActions";

type SearchParams = Promise<{
  q?: string;
  direction?: string;
  status?: string;
  from?: string;
  to?: string;
}>;

export default async function CetakArsipPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("letters")
    .select(
      "agenda_number, direction, letter_number, letter_date, counterpart, subject, status"
    )
    .is("deleted_at", null)
    .order("letter_date", { ascending: false });

  if (sp.q) {
    query = query.or(
      `subject.ilike.%${sp.q}%,counterpart.ilike.%${sp.q}%,letter_number.ilike.%${sp.q}%`
    );
  }
  if (sp.direction === "masuk" || sp.direction === "keluar") {
    query = query.eq("direction", sp.direction);
  }
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.from) query = query.gte("letter_date", sp.from);
  if (sp.to) query = query.lte("letter_date", sp.to);

  const { data: letters } = await query;

  const filters: string[] = [];
  if (sp.direction) filters.push(`Arah: ${sp.direction}`);
  if (sp.status) filters.push(`Status: ${sp.status}`);
  if (sp.from || sp.to)
    filters.push(`Periode: ${sp.from ?? "..."} s/d ${sp.to ?? "..."}`);
  if (sp.q) filters.push(`Pencarian: "${sp.q}"`);

  const printedAt = new Date().toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-5xl bg-white p-8 text-slate-900">
      <PrintActions />

      <div className="mb-4 flex items-center gap-3 border-b border-slate-300 pb-4">
        <Image src="/logo-jari.png" alt="JaRI" width={48} height={48} />
        <div>
          <h1 className="text-lg font-bold">Arsip Surat — Yayasan JaRI</h1>
          <p className="text-xs text-slate-500">Dicetak: {printedAt}</p>
        </div>
      </div>

      {filters.length > 0 && (
        <p className="mb-3 text-xs text-slate-600">{filters.join(" | ")}</p>
      )}
      <p className="mb-3 text-xs text-slate-600">
        Total: {(letters ?? []).length} surat
      </p>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border border-slate-300 px-2 py-1.5">Arah</th>
            <th className="border border-slate-300 px-2 py-1.5">No</th>
            <th className="border border-slate-300 px-2 py-1.5">Tanggal</th>
            <th className="border border-slate-300 px-2 py-1.5">No Surat</th>
            <th className="border border-slate-300 px-2 py-1.5">Pihak</th>
            <th className="border border-slate-300 px-2 py-1.5">Perihal</th>
            <th className="border border-slate-300 px-2 py-1.5">Status</th>
          </tr>
        </thead>
        <tbody>
          {(letters ?? []).map((l, i) => (
            <tr key={i} className="align-top">
              <td className="border border-slate-300 px-2 py-1.5">{l.direction}</td>
              <td className="border border-slate-300 px-2 py-1.5">{l.agenda_number}</td>
              <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                {l.letter_date}
              </td>
              <td className="border border-slate-300 px-2 py-1.5">{l.letter_number}</td>
              <td className="border border-slate-300 px-2 py-1.5">{l.counterpart}</td>
              <td className="border border-slate-300 px-2 py-1.5">{l.subject}</td>
              <td className="border border-slate-300 px-2 py-1.5">{l.status}</td>
            </tr>
          ))}
          {(!letters || letters.length === 0) && (
            <tr>
              <td colSpan={7} className="border border-slate-300 px-2 py-4 text-center text-slate-400">
                Tidak ada data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
