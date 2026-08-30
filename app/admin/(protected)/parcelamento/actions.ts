"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireAdmin} from "@/lib/auth";
import {execute, isDatabaseConfigured} from "@/lib/db";
import {optionalHttpUrl, slugify} from "@/lib/utils";

function text(data: FormData, key: string): string {
  return String(data.get(key) || "").trim();
}

function number(data: FormData, key: string, minimum = 0): number {
  const parsed = Number(text(data, key).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < minimum) throw new Error(`Valor inválido em ${key}.`);
  return parsed;
}

function finish(message: string): never {
  revalidatePath("/admin/parcelamento");
  revalidatePath("/admin/configuracoes");
  revalidatePath("/api/installments");
  redirect(`/admin/parcelamento?salvo=${encodeURIComponent(message)}`);
}

function fail(error: unknown, fallback: string): never {
  const message = encodeURIComponent(error instanceof Error ? error.message : fallback);
  redirect(`/admin/parcelamento?erro=${message}`);
}

export async function saveMachineAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!isDatabaseConfigured()) redirect("/admin/parcelamento?erro=banco-nao-configurado");
  try {
    const name = text(formData, "name");
    if (!name) throw new Error("Informe o nome da máquina.");
    await execute(`
      INSERT INTO payment_machines (name, public_name, active, pass_fee_to_customer, sort_order)
      VALUES (?, ?, 1, ?, ?)
      ON DUPLICATE KEY UPDATE public_name = VALUES(public_name), active = 1,
        pass_fee_to_customer = VALUES(pass_fee_to_customer), sort_order = VALUES(sort_order)
    `, [name, text(formData, "publicName") || null, formData.get("passFee") === "on" ? 1 : 0, number(formData, "sortOrder", 0)]);
  } catch (error) {
    fail(error, "Falha ao salvar máquina.");
  }
  finish("Máquina salva.");
}

export async function saveCardBrandAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!isDatabaseConfigured()) redirect("/admin/parcelamento?erro=banco-nao-configurado");
  try {
    const name = text(formData, "name");
    if (!name) throw new Error("Informe a bandeira.");
    const slug = slugify(name);
    await execute(`
      INSERT INTO card_brands (name, slug, logo_url, active, sort_order)
      VALUES (?, ?, ?, 1, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name), logo_url = VALUES(logo_url), active = 1, sort_order = VALUES(sort_order)
    `, [name, slug, optionalHttpUrl(text(formData, "logoUrl")), number(formData, "sortOrder", 0)]);
  } catch (error) {
    fail(error, "Falha ao salvar bandeira.");
  }
  finish("Bandeira salva.");
}

export async function saveRateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!isDatabaseConfigured()) redirect("/admin/parcelamento?erro=banco-nao-configurado");
  try {
    const machineId = number(formData, "machineId", 1);
    const cardBrandId = number(formData, "cardBrandId", 1);
    const installments = number(formData, "installments", 1);
    if (!Number.isInteger(installments) || installments > 24) throw new Error("Parcelas devem ficar entre 1 e 24.");
    const percentRate = number(formData, "percentRate", 0);
    if (percentRate >= 100) throw new Error("A taxa deve ser menor que 100%.");
    await execute(`
      INSERT INTO installment_rates (
        machine_id, card_brand_id, installments, percent_rate, fixed_fee, minimum_total, active
      ) VALUES (?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE percent_rate = VALUES(percent_rate), fixed_fee = VALUES(fixed_fee),
        minimum_total = VALUES(minimum_total), active = 1
    `, [machineId, cardBrandId, installments, percentRate, number(formData, "fixedFee", 0), number(formData, "minimumTotal", 0)]);
  } catch (error) {
    fail(error, "Falha ao salvar taxa.");
  }
  finish("Taxa salva.");
}

export async function deleteRateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (isDatabaseConfigured() && Number.isInteger(id) && id > 0) {
    await execute("DELETE FROM installment_rates WHERE id = ?", [id]);
  }
  finish("Taxa removida.");
}
