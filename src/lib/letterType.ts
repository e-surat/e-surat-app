export const LETTER_TYPES = [
  "Undangan",
  "Permohonan",
  "Surat Tugas",
  "Terima Kasih/Penghargaan",
  "Hasil Visum/Psikologis",
  "Invoice",
  "Sertifikat",
  "Surat Keterangan",
  "Lain-lain",
] as const;

export type LetterType = (typeof LETTER_TYPES)[number];

export function classifyLetter(subject: string | null | undefined): LetterType {
  const s = (subject ?? "").toLowerCase();
  if (!s) return "Lain-lain";
  if (s.includes("undang")) return "Undangan";
  if (s.includes("hasil") && (s.includes("visum") || s.includes("psikolog")))
    return "Hasil Visum/Psikologis";
  if (s.includes("terima kasih") || s.includes("penghargaan"))
    return "Terima Kasih/Penghargaan";
  if (s.includes("tugas") || /\bspk\b/.test(s)) return "Surat Tugas";
  if (s.includes("invoice")) return "Invoice";
  if (s.includes("sertifikat")) return "Sertifikat";
  if (s.includes("keterangan")) return "Surat Keterangan";
  if (
    s.includes("permohonan") ||
    s.includes("permintaan") ||
    s.includes("visum") ||
    s.includes("observasi") ||
    s.includes("penelitian") ||
    s.includes("ijin") ||
    s.includes("izin")
  )
    return "Permohonan";
  return "Lain-lain";
}

export const CHART_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
];
