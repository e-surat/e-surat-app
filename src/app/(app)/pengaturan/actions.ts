"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLES = ["admin", "pimpinan", "staf"] as const;

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return me?.role === "admin";
}

export async function createUser(formData: FormData) {
  if (!(await assertAdmin())) return { error: "Tidak punya akses." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "staf");

  if (!email || password.length < 6) {
    return { error: "Email wajib & password minimal 6 karakter." };
  }
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return { error: "Role tidak valid." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || email },
  });

  if (error) return { error: error.message };

  if (data.user) {
    await admin
      .from("profiles")
      .update({ full_name: fullName || email, role })
      .eq("id", data.user.id);
  }

  revalidatePath("/pengaturan");
  return { success: `User ${email} dibuat.` };
}

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
