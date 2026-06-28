"use client";

import { useActionState } from "react";
import { createUser } from "./actions";
import { ROLE_OPTIONS } from "@/lib/roles";

type State = { error?: string; success?: string } | null;

async function action(_prev: State, formData: FormData): Promise<State> {
  return await createUser(formData);
}

export default function AddUserForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    action,
    null
  );

  return (
    <form
      action={formAction}
      className="mb-6 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-5"
    >
      <input name="full_name" placeholder="Nama lengkap" className="input" />
      <input
        type="email"
        name="email"
        placeholder="Email"
        required
        className="input"
      />
      <input
        type="password"
        name="password"
        placeholder="Password (min. 6)"
        required
        className="input"
      />
      <select name="role" defaultValue="officer" className="input">
        {ROLE_OPTIONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <button
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Tambah User"}
      </button>
      {state?.error && (
        <p className="text-sm text-red-600 sm:col-span-5">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 sm:col-span-5">{state.success}</p>
      )}
    </form>
  );
}
