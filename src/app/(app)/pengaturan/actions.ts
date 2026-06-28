"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_VALUES, ADMIN_ROLES } from "@/lib/roles";

async function getAdmin(): Promise<{ ok: boolean; userId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return { ok: ADMIN_ROLES.includes(me?.role ?? ""), userId: user.id };
}

export async function createUser(formData: FormData) {
  const { ok } = await getAdmin();
  if (!ok) return { error: "Tidak punya akses." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "viewer");

  if (!email || password.length < 6) {
    return { error: "Email wajib & password minimal 6 karakter." };
  }
  if (!ROLE_VALUES.includes(role as never)) {
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

export async function editUser(formData: FormData) {
  const { ok } = await getAdmin();
  if (!ok) return { error: "Tidak punya akses." };

  const userId = String(formData.get("user_id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "");

  if (!userId) return { error: "User tidak valid." };
  if (!ROLE_VALUES.includes(role as never)) {
    return { error: "Role tidak valid." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ full_name: fullName, role })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/pengaturan");
  return { success: "Perubahan disimpan." };
}

export async function deleteUser(formData: FormData) {
  const { ok, userId: me } = await getAdmin();
  if (!ok) return { error: "Tidak punya akses." };

  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return { error: "User tidak valid." };
  if (userId === me) return { error: "Tidak bisa menghapus akun sendiri." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/pengaturan");
  return { success: "User dihapus." };
}
