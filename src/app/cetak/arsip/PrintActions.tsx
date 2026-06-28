"use client";

import { useEffect } from "react";

export default function PrintActions() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mb-4 flex gap-2 print:hidden">
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Cetak / Simpan PDF
      </button>
      <button
        onClick={() => window.close()}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Tutup
      </button>
    </div>
  );
}
