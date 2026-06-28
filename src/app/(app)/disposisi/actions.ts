"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createDisposition(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const letterId = String(formData.get("letter_id") || "");
  const toUser = String(formData.get("to_user") || "");
  const instruction = String(formData.get("instruction") || "").trim();
  const dueDate = String(formData.get("due_date") || "");

  if (!letterId || !toUser) {
    throw new Error("Penerima disposisi wajib dipilih.");
  }

  const { error } = await supabase.from("dispositions").insert({
    letter_id: letterId,
    from_user: user.id,
    to_user: toUser,
    instruction: instruction || null,
    due_date: dueDate || null,
  });

  if (error) throw new Error(error.message);

  await supabase
    .from("letters")
    .update({ status: "didisposisikan" })
    .eq("id", letterId);

  await supabase.from("notifications").insert({
    user_id: toUser,
    message: `Anda menerima disposisi baru${instruction ? `: ${instruction}` : ""}`,
    link: `/surat/${letterId}`,
  });

  revalidatePath(`/surat/${letterId}`);
  revalidatePath("/disposisi");
}

export async function updateDispositionStatus(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["dibaca", "selesai"].includes(status)) {
    throw new Error("Status tidak valid.");
  }

  const { data: disp, error } = await supabase
    .from("dispositions")
    .update({ status })
    .eq("id", id)
    .select("letter_id, from_user")
    .single();

  if (error) throw new Error(error.message);

  if (status === "selesai" && disp?.from_user) {
    await supabase.from("notifications").insert({
      user_id: disp.from_user,
      message: "Disposisi Anda telah ditindaklanjuti (selesai).",
      link: disp.letter_id ? `/surat/${disp.letter_id}` : null,
    });
  }

  revalidatePath("/disposisi");
}
