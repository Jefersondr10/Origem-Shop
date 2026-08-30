"use server";

import type {RowDataPacket} from "mysql2/promise";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireAdmin} from "@/lib/auth";
import {isDatabaseConfigured, queryRows, withTransaction} from "@/lib/db";
import {saoPauloDateTimeToMysql} from "@/lib/utils";

function optionalNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value || "").trim().replace(",", ".");
  if (!text) return null;
  const number = Number(text);
  if (!Number.isFinite(number) || number < 0) throw new Error("Valor monetário inválido.");
  return Number(number.toFixed(2));
}

export async function updateProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!isDatabaseConfigured()) redirect("/admin/produtos?erro=banco-nao-configurado");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/produtos?erro=produto-invalido");

  let destination: string;
  try {
    const salePrice = optionalNumber(formData.get("salePrice"));
    const promotionalPrice = optionalNumber(formData.get("promotionalPrice"));
    if (promotionalPrice != null && salePrice != null && promotionalPrice >= salePrice) {
      throw new Error("O preço promocional deve ser menor que o preço normal.");
    }
    const startsAt = saoPauloDateTimeToMysql(formData.get("promotionStartsAt"));
    const endsAt = saoPauloDateTimeToMysql(formData.get("promotionEndsAt"));
    if (startsAt && endsAt && startsAt > endsAt) throw new Error("O fim da promoção deve ser posterior ao início.");
    const published = formData.get("published") === "on" ? 1 : 0;
    const featured = formData.get("featured") === "on" ? 1 : 0;

    const [current] = await queryRows<RowDataPacket & {sale_price: number | string | null; promotional_price: number | string | null}>(
      "SELECT sale_price, promotional_price FROM products WHERE id = ? LIMIT 1",
      [id],
    );
    if (!current) throw new Error("Produto não encontrado.");

    await withTransaction(async (connection) => {
      await connection.execute(`
        UPDATE products
        SET sale_price = ?, promotional_price = ?, promotion_starts_at = ?, promotion_ends_at = ?,
          published = IF(source_active = 1, ?, 0), featured = ?, manual_price_locked = 1
        WHERE id = ?
      `, [salePrice, promotionalPrice, startsAt, endsAt, published, featured, id]);
      await connection.execute(`
        INSERT INTO product_price_history (
          product_id, previous_sale_price, new_sale_price,
          previous_promotional_price, new_promotional_price, changed_by
        ) VALUES (?, ?, ?, ?, ?, 'admin')
      `, [id, current.sale_price, salePrice, current.promotional_price, promotionalPrice]);
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/produtos");
    destination = `/admin/produtos?salvo=${id}`;
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : "Falha ao salvar produto.");
    destination = `/admin/produtos?erro=${message}`;
  }

  redirect(destination);
}
