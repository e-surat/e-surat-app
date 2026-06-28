"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Notif = {
  id: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const supabase = createClient();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id, message, link, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(15);
    setItems(data ?? []);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const unread = items.filter((i) => !i.is_read).length;

  async function markAllRead() {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
      >
        Notifikasi
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <span className="text-sm font-semibold text-slate-800">
              Notifikasi
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-400">
                Tidak ada notifikasi.
              </li>
            )}
            {items.map((n) => {
              const content = (
                <div
                  className={`px-4 py-3 text-sm ${
                    n.is_read ? "text-slate-500" : "bg-slate-50 text-slate-800"
                  }`}
                >
                  {n.message}
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={n.link} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
