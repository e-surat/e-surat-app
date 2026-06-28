"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createSuratKeluar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const letterDate = String(formData.get("letter_date") || "");
  const categoryId = String(formData.get("category_id") || "");
  const counterpart = String(formData.get("counterpart") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const file = formData.get("file") as File | null;

  if (!letterDate || !categoryId || !counterpart || !subject) {
    throw new Error("Lengkapi semua field wajib.");
  }

  const { data: letter, error: insertError } = await supabase
    .from("letters")
    .insert({
      direction: "keluar",
      category_id: categoryId,
      letter_date: letterDate,
      counterpart,
      subject,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !letter) {
    throw new Error(insertError?.message || "Gagal menyimpan surat.");
  }

  if (file && file.size > 0) {
    const path = `keluar/${letter.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("surat")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (!uploadError) {
      await supabase.from("attachments").insert({
        letter_id: letter.id,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: user.id,
      });
    }
  }

  revalidatePath("/surat-keluar");
  redirect("/surat-keluar");
}
