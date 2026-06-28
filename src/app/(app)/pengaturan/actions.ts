"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ROLES = ["admin", "pimpinan", "staf"] as const;

export async function updateRole(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!userId || !ROLES.includes(role as (typeof ROLES)[number])) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return;

  await supabase.from("profiles").update({ role }).eq("id", userId);

  revalidatePath("/pengaturan");
}
