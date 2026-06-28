"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_OPTIONS, roleLabel } from "@/lib/roles";
import { editUser, deleteUser } from "./actions";

export type UserRowData = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  lastActive: string | null;
};

function fmt(date: string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRowData[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<UserRowData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSave(formData: FormData) {
    setBusy(true);
    setError("");
    const res = await editUser(formData);
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function onDelete(u: UserRowData) {
    if (!confirm(`Hapus user "${u.fullName || u.email}"? Tindakan ini permanen.`)) {
      return;
    }
    const fd = new FormData();
    fd.set("user_id", u.id);
    const res = await deleteUser(fd);
    if (res?.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3">Terakhir Aktif</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {u.fullName || "(tanpa nama)"}
                </td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-slate-700">{roleLabel(u.role)}</td>
                <td className="px-4 py-3">
                  {u.isActive ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Aktif
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                      Nonaktif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                  {fmt(u.lastLogin)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                  {fmt(u.lastActive)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setError("");
                        setEditing(u);
                      }}
                      title="Edit"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(u)}
                      disabled={u.id === currentUserId}
                      title={
                        u.id === currentUserId
                          ? "Tidak bisa menghapus akun sendiri"
                          : "Hapus"
                      }
                      className="text-slate-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Belum ada pengguna.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditing(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Edit Pengguna
            </h3>
            <form action={onSave} className="space-y-3">
              <input type="hidden" name="user_id" value={editing.id} />
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Email
                </label>
                <input
                  value={editing.email}
                  disabled
                  className="input bg-slate-100 text-slate-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Nama
                </label>
                <input
                  name="full_name"
                  defaultValue={editing.fullName}
                  placeholder="Nama lengkap"
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Role
                </label>
                <select
                  name="role"
                  defaultValue={
                    ROLE_OPTIONS.some((r) => r.value === editing.role)
                      ? editing.role
                      : "viewer"
                  }
                  className="input"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  disabled={busy}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
