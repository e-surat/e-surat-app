import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;

  let query = supabase
    .from("letters")
    .select(
      "agenda_number, direction, letter_number, letter_date, counterpart, subject, status"
    )
    .is("deleted_at", null)
    .order("letter_date", { ascending: false });

  const q = sp.get("q");
  const direction = sp.get("direction");
  const status = sp.get("status");
  const from = sp.get("from");
  const to = sp.get("to");

  if (q) {
    query = query.or(
      `subject.ilike.%${q}%,counterpart.ilike.%${q}%,letter_number.ilike.%${q}%`
    );
  }
  if (direction === "masuk" || direction === "keluar") {
    query = query.eq("direction", direction);
  }
  if (status) query = query.eq("status", status);
  if (from) query = query.gte("letter_date", from);
  if (to) query = query.lte("letter_date", to);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = [
    "No Agenda",
    "Arah",
    "No Surat",
    "Tanggal",
    "Pihak",
    "Perihal",
    "Status",
  ];
  const rows = (data ?? []).map((l) =>
    [
      l.agenda_number,
      l.direction,
      l.letter_number,
      l.letter_date,
      l.counterpart,
      l.subject,
      l.status,
    ]
      .map(csvCell)
      .join(",")
  );
  const csv = "\uFEFF" + [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="arsip-surat.csv"`,
    },
  });
}
