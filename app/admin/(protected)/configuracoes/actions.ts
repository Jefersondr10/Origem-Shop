"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireAdmin} from "@/lib/auth";
import {execute, isDatabaseConfigured} from "@/lib/db";
import {disconnectTiny} from "@/lib/tiny";
import {optionalHttpUrl} from "@/lib/utils";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) || "").trim();
}

function optionalId(value: string): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export async function updateSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!isDatabaseConfigured()) redirect("/admin/configuracoes?erro=banco-nao-configurado");

  let destination: string;
  try {
    const maxInstallments = Math.min(24, Math.max(1, Number(text(formData, "maxInstallments")) || 12));
    const catalogName = text(formData, "catalogName") || "Origem";
    if (catalogName.length > 120) throw new Error("O nome do catálogo deve ter no máximo 120 caracteres.");
    const logoUrl = optionalHttpUrl(text(formData, "logoUrl"));
    const mapsUrl = optionalHttpUrl(text(formData, "mapsUrl"));
    await execute(`
      UPDATE catalog_settings SET
        catalog_name = ?, logo_url = ?, whatsapp = ?, whatsapp_message_template = ?,
        instagram = ?, address = ?, maps_url = ?, business_hours = ?, footer_text = ?,
        max_installments = ?, default_machine_id = ?, default_card_brand_id = ?
      WHERE id = 1
    `, [
      catalogName,
      logoUrl,
      text(formData, "whatsapp"),
      text(formData, "whatsappMessageTemplate") || null,
      text(formData, "instagram"),
      text(formData, "address") || null,
      mapsUrl,
      text(formData, "businessHours") || null,
      text(formData, "footerText") || null,
      maxInstallments,
      optionalId(text(formData, "defaultMachineId")),
      optionalId(text(formData, "defaultCardBrandId")),
    ]);
    revalidatePath("/", "layout");
    revalidatePath("/admin/configuracoes");
    destination = "/admin/configuracoes?salvo=1";
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : "Falha ao salvar configurações.");
    destination = `/admin/configuracoes?erro=${message}`;
  }

  redirect(destination);
}

export async function disconnectTinyAction(): Promise<void> {
  await requireAdmin();
  let destination: string;
  try {
    await disconnectTiny();
    revalidatePath("/admin/configuracoes");
    destination = "/admin/configuracoes?tiny=desconectado";
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : "Falha ao desconectar o Tiny.");
    destination = `/admin/configuracoes?tiny=erro&mensagem=${message}`;
  }
  redirect(destination);
}
