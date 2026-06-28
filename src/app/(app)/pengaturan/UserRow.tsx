"use client";

import { ROLE_OPTIONS } from "@/lib/roles";
import { editUser, deleteUser } from "./actions";

type Props = {
  id: string;
  fullName: string;
  role: string;
  division: string;
  isSelf: boolean;
};

export default function UserRow({ id, fullName, role, division, isSelf }: Props) {
  const validRole = ROLE_OPTIONS.some((r) => r.value === role) ? role : "viewer";

  async function handleEdit(formData: FormData) {
    await editUser(formData);
  }

  async function handleDelete(formData: FormData) {
    await deleteUser(formData);
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <form action={handleEdit} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="user_id" value={id} />
          <input
            name="full_name"
            defaultValue={fullName}
            placeholder="Nama"
            className="input w-44"
          />
          <select name="role" defaultValue={validRole} className="input w-36">
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
            Simpan
          </button>
        </form>
      </td>
      <td className="px-4 py-3 text-slate-600">{division}</td>
      <td className="px-4 py-3">
        <form
          action={handleDelete}
          onSubmit={(e) => {
            if (!confirm(`Hapus user "${fullName}"? Tindakan ini permanen.`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="user_id" value={id} />
          <button
            disabled={isSelf}
            title={isSelf ? "Tidak bisa menghapus akun sendiri" : "Hapus user"}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Hapus
          </button>
        </form>
      </td>
    </tr>
  );
}
