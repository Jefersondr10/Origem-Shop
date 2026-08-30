"use server";

import type {ResultSetHeader} from "mysql2/promise";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireAdmin} from "@/lib/auth";
import {execute, isDatabaseConfigured, withTransaction} from "@/lib/db";
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

type ProvidedRatePreset = {
  name: string;
  slug: string;
  sortOrder: number;
  rates: Array<[installments: number, percentRate: number]>;
};

const PROVIDED_RATE_PRESETS: ProvidedRatePreset[] = [
  {
    name: "Visa / Mastercard - Crédito",
    slug: "visa-mastercard-credito",
    sortOrder: 10,
    rates: [
      [1, 3.74], [2, 5.05], [3, 5.92], [4, 6.48], [5, 7.05], [6, 7.63],
      [7, 9.29], [8, 10.08], [9, 10.43], [10, 10.78], [11, 11.13], [12, 11.79],
      [13, 12.79], [14, 13.78], [15, 14.32], [16, 14.79], [17, 15.31], [18, 15.69],
    ],
  },
  {
    name: "Outras Bandeiras - Crédito",
    slug: "outras-bandeiras-credito",
    sortOrder: 20,
    rates: [
      [1, 4.74], [2, 6.05], [3, 6.92], [4, 7.48], [5, 8.05], [6, 8.63],
      [7, 10.29], [8, 11.08], [9, 11.43], [10, 11.78], [11, 12.13], [12, 12.79],
      [13, 13.79], [14, 14.78], [15, 15.32], [16, 15.79], [17, 16.31], [18, 16.69],
    ],
  },
  {
    name: "Visa / Mastercard - Débito",
    slug: "visa-mastercard-debito",
    sortOrder: 30,
    rates: [[1, 1.99]],
  },
  {
    name: "Outras Bandeiras - Débito",
    slug: "outras-bandeiras-debito",
    sortOrder: 40,
    rates: [[1, 2.49]],
  },
];

export async function loadProvidedRatesAction(_formData: FormData): Promise<void> {
  await requireAdmin();
  if (!isDatabaseConfigured()) redirect("/admin/parcelamento?erro=banco-nao-configurado");

  try {
    await withTransaction(async (connection) => {
      const [machineResult] = await connection.execute<ResultSetHeader>(`
        INSERT INTO payment_machines (name, public_name, active, pass_fee_to_customer, sort_order)
        VALUES ('Máquina principal', 'Cartão', 1, 1, 0)
        ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), public_name = VALUES(public_name),
          active = 1, pass_fee_to_customer = 1, sort_order = VALUES(sort_order)
      `);
      const machineId = Number(machineResult.insertId);
      if (!machineId) throw new Error("Não foi possível identificar a máquina principal.");

      let defaultCardBrandId = 0;
      for (const preset of PROVIDED_RATE_PRESETS) {
        const [brandResult] = await connection.execute<ResultSetHeader>(`
          INSERT INTO card_brands (name, slug, logo_url, active, sort_order)
          VALUES (?, ?, NULL, 1, ?)
          ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = VALUES(name),
            active = 1, sort_order = VALUES(sort_order)
        `, [preset.name, preset.slug, preset.sortOrder]);
        const cardBrandId = Number(brandResult.insertId);
        if (!cardBrandId) throw new Error(`Não foi possível cadastrar ${preset.name}.`);
        if (preset.slug === "visa-mastercard-credito") defaultCardBrandId = cardBrandId;

        for (const [installments, percentRate] of preset.rates) {
          await connection.execute(`
            INSERT INTO installment_rates (
              machine_id, card_brand_id, installments, percent_rate, fixed_fee, minimum_total, active
            ) VALUES (?, ?, ?, ?, 0, 0, 1)
            ON DUPLICATE KEY UPDATE percent_rate = VALUES(percent_rate), fixed_fee = 0,
              minimum_total = 0, active = 1
          `, [machineId, cardBrandId, installments, percentRate]);
        }
      }

      if (!defaultCardBrandId) throw new Error("Não foi possível definir Visa / Mastercard como condição padrão.");
      await connection.execute(`
        INSERT INTO catalog_settings (
          id, catalog_name, max_installments, default_machine_id, default_card_brand_id
        ) VALUES (1, 'Origem', 18, ?, ?)
        ON DUPLICATE KEY UPDATE max_installments = GREATEST(max_installments, 18),
          default_machine_id = VALUES(default_machine_id),
          default_card_brand_id = VALUES(default_card_brand_id)
      `, [machineId, defaultCardBrandId]);
    });
  } catch (error) {
    fail(error, "Falha ao carregar as taxas informadas.");
  }

  finish("As 38 condições de cartão foram carregadas e o parcelamento foi liberado até 18x.");
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
