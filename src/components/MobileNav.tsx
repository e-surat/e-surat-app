"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100"
      >
        <span className="block h-0.5 w-5 bg-slate-700" />
        <span className="mt-1 block h-0.5 w-5 bg-slate-700" />
        <span className="mt-1 block h-0.5 w-5 bg-slate-700" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <Image
                src="/logo-jari.png"
                alt="Yayasan JaRI"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <nav className="space-y-1">
              {NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
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
        </div>
      )}
    </div>
  );
}
