"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/lib/nav";
import { Icon } from "@/components/icons";

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="px-5 py-5">
        <Image
          src="/logo-jari.png"
          alt="Yayasan JaRI"
          width={140}
          height={48}
          className="h-12 w-auto"
        />
        <p className="mt-2 text-sm font-semibold text-slate-900">e-Surat</p>
      </div>
      <nav className="space-y-5 px-3 pb-6">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((i) => !i.adminOnly || isAdmin);
          if (items.length === 0) return null;
          return (
            <div key={section.title}>
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
