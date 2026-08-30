"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireAdmin} from "@/lib/auth";
import {execute, isDatabaseConfigured} from "@/lib/db";
import {optionalHttpUrl} from "@/lib/utils";

export async function updateBrandLogoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!isDatabaseConfigured()) redirect("/admin/marcas?erro=banco-nao-configurado");
  const id = Number(formData.get("id"));
  const logoUrlText = String(formData.get("logoUrl") || "").trim();
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/marcas?erro=marca-invalida");

  let destination: string;
  try {
    const logoUrl = optionalHttpUrl(logoUrlText);
    await execute("UPDATE brands SET manual_logo_url = ? WHERE id = ?", [logoUrl, id]);
    revalidatePath("/", "layout");
    revalidatePath("/admin/marcas");
    destination = `/admin/marcas?salvo=${id}`;
  } catch (error) {
    destination = `/admin/marcas?erro=${encodeURIComponent(error instanceof Error ? error.message : "Falha ao salvar logo.")}`;
  }

  redirect(destination);
}
