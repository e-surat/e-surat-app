"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/surat-masuk", label: "Surat Masuk" },
  { href: "/surat-keluar", label: "Surat Keluar" },
  { href: "/disposisi", label: "Disposisi" },
  { href: "/arsip", label: "Arsip" },
  { href: "/laporan", label: "Laporan" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="px-5 py-5">
        <p className="text-lg font-bold text-slate-900">e-Surat</p>
        <p className="text-xs text-slate-500">Yayasan JaRI</p>
      </div>
      <nav className="space-y-1 px-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
