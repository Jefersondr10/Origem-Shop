import type {PoolConnection, ResultSetHeader, RowDataPacket} from "mysql2/promise";
import {execute, queryRows, withTransaction} from "@/lib/db";
import {sourcePageSchema, type SourcePage, type SourceProduct} from "@/lib/source-schema";
import {fillMissingCostsFromTiny} from "@/lib/tiny";
import {slugify, toMysqlDate, uniqueSlug} from "@/lib/utils";

type SyncStats = {
  pages: number;
  brands: number;
  categories: number;
  products: number;
  deleted: number;
  tinyCostsChecked: number;
  tinyCostsUpdated: number;
  tinyCostErrors: number;
};

interface CursorRow extends RowDataPacket {
  cursor_value: string | null;
}

function sourceUrl(cursor: string | null, full: boolean): string {
  const base = process.env.MEDIA_API_URL?.replace(/\/$/, "");
  if (!base) throw new Error("MEDIA_API_URL não configurada.");
  const url = new URL(`${base}/api/catalog-export`);
  url.searchParams.set("limit", "100");
  url.searchParams.set("mode", full ? "full" : "incremental");
  if (cursor) url.searchParams.set("cursor", cursor);
  return url.toString();
}

async function fetchSourcePage(cursor: string | null, full: boolean): Promise<SourcePage> {
  const token = process.env.MEDIA_API_TOKEN;
  if (!token) throw new Error("MEDIA_API_TOKEN não configurado.");
  const response = await fetch(sourceUrl(cursor, full), {
    headers: {Authorization: `Bearer ${token}`, Accept: "application/json"},
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Sistema de mídia respondeu ${response.status}.`);
  const payload = await response.json();
  const normalized = payload && typeof payload === "object" && "data" in payload
    ? (payload as {data: unknown}).data
    : payload;
  return sourcePageSchema.parse(normalized);
}

async function upsertBrand(connection: PoolConnection, brand: SourcePage["brands"][number]): Promise<void> {
  const baseSlug = uniqueSlug(brand.name, brand.external_id);
  await connection.execute(`
    INSERT INTO brands (external_id, name, slug, source_logo_url, active, sort_order, source_updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      source_logo_url = VALUES(source_logo_url),
      active = VALUES(active),
      sort_order = VALUES(sort_order),
      source_updated_at = VALUES(source_updated_at),
      updated_at = CURRENT_TIMESTAMP
  `, [brand.external_id, brand.name, baseSlug, brand.logo_url || null, brand.active ? 1 : 0, brand.sort_order, toMysqlDate(brand.updated_at)]);
}

async function upsertCategory(connection: PoolConnection, category: SourcePage["categories"][number]): Promise<void> {
  const baseSlug = uniqueSlug(category.name, category.external_id);
  await connection.execute(`
    INSERT INTO categories (external_id, parent_external_id, name, slug, image_url, active, sort_order, source_updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      parent_external_id = VALUES(parent_external_id),
      name = VALUES(name),
      image_url = VALUES(image_url),
      active = VALUES(active),
      sort_order = VALUES(sort_order),
      source_updated_at = VALUES(source_updated_at),
      updated_at = CURRENT_TIMESTAMP
  `, [category.external_id, category.parent_external_id || null, category.name, baseSlug, category.image_url || null, category.active ? 1 : 0, category.sort_order, toMysqlDate(category.updated_at)]);
}

async function lookupId(connection: PoolConnection, table: "brands" | "categories", externalId: string | null | undefined): Promise<number | null> {
  if (!externalId) return null;
  const [rows] = await connection.execute<(RowDataPacket & {id: number})[]>(`SELECT id FROM ${table} WHERE external_id = ? LIMIT 1`, [externalId]);
  return rows[0] ? Number(rows[0].id) : null;
}

async function upsertProduct(connection: PoolConnection, product: SourceProduct): Promise<void> {
  const [brandId, categoryId] = await Promise.all([
    lookupId(connection, "brands", product.brand_external_id),
    lookupId(connection, "categories", product.category_external_id),
  ]);
  const sourceCost = product.cost ?? product.average_cost ?? null;
  const productSlug = uniqueSlug(product.slug || product.name, product.external_id);
  await connection.execute(`
    INSERT INTO products (
      external_id, tiny_product_id, sku, ean, name, slug,
      short_description, description_html, brand_id, category_id,
      images_json, attributes_json, stock_quantity, stock_status,
      source_active, published, cost, cost_source, source_updated_at, archived_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      tiny_product_id = VALUES(tiny_product_id),
      sku = VALUES(sku),
      ean = VALUES(ean),
      name = VALUES(name),
      short_description = VALUES(short_description),
      description_html = VALUES(description_html),
      brand_id = VALUES(brand_id),
      category_id = VALUES(category_id),
      images_json = VALUES(images_json),
      attributes_json = VALUES(attributes_json),
      stock_quantity = VALUES(stock_quantity),
      stock_status = VALUES(stock_status),
      source_active = VALUES(source_active),
      cost = IF(VALUES(cost) IS NULL, cost, VALUES(cost)),
      cost_source = IF(VALUES(cost) IS NULL, cost_source, VALUES(cost_source)),
      source_updated_at = VALUES(source_updated_at),
      archived_at = IF(VALUES(source_active) = 1, NULL, COALESCE(archived_at, CURRENT_TIMESTAMP)),
      updated_at = CURRENT_TIMESTAMP
  `, [
    product.external_id,
    product.tiny_product_id || null,
    product.sku || null,
    product.ean || null,
    product.name,
    productSlug,
    product.short_description || null,
    product.description_html || null,
    brandId,
    categoryId,
    JSON.stringify(product.images),
    JSON.stringify(product.attributes),
    product.stock_quantity ?? null,
    product.stock_status || "available",
    product.active ? 1 : 0,
    product.active ? 1 : 0,
    sourceCost,
    sourceCost == null ? "unknown" : "media",
    toMysqlDate(product.updated_at),
    product.active ? null : new Date(),
  ]);
}

async function applyPage(page: SourcePage): Promise<{brands: number; categories: number; products: number; deleted: number}> {
  return withTransaction(async (connection) => {
    for (const brand of page.brands) await upsertBrand(connection, brand);
    for (const category of page.categories) await upsertCategory(connection, category);

    await connection.execute(`
      UPDATE categories child
      LEFT JOIN categories parent ON parent.external_id = child.parent_external_id
      SET child.parent_id = parent.id
      WHERE child.parent_external_id IS NOT NULL
    `);

    for (const product of page.products) await upsertProduct(connection, product);

    for (const externalId of page.deleted_product_external_ids) {
      await connection.execute(`
        UPDATE products
        SET source_active = 0, archived_at = COALESCE(archived_at, CURRENT_TIMESTAMP)
        WHERE external_id = ?
      `, [externalId]);
    }

    return {
      brands: page.brands.length,
      categories: page.categories.length,
      products: page.products.length,
      deleted: page.deleted_product_external_ids.length,
    };
  });
}

async function getLastCursor(): Promise<string | null> {
  const rows = await queryRows<CursorRow>(`
    SELECT cursor_value FROM sync_runs
    WHERE source_type = 'media' AND status = 'success' AND cursor_value IS NOT NULL
    ORDER BY id DESC LIMIT 1
  `);
  return rows[0]?.cursor_value || null;
}

export async function syncCatalog(options: {full?: boolean} = {}): Promise<SyncStats> {
  const full = Boolean(options.full);
  const initialCursor = full ? null : await getLastCursor();
  const run = await execute(
    "INSERT INTO sync_runs (source_type, status, mode, cursor_value) VALUES ('media', 'running', ?, ?)",
    [full ? "full" : "incremental", initialCursor],
  );
  const runId = Number((run as ResultSetHeader).insertId);
  const stats: SyncStats = {pages: 0, brands: 0, categories: 0, products: 0, deleted: 0, tinyCostsChecked: 0, tinyCostsUpdated: 0, tinyCostErrors: 0};
  let cursor = initialCursor;

  try {
    do {
      const page = await fetchSourcePage(cursor, full);
      const applied = await applyPage(page);
      stats.pages += 1;
      stats.brands += applied.brands;
      stats.categories += applied.categories;
      stats.products += applied.products;
      stats.deleted += applied.deleted;
      cursor = page.next_cursor || page.source_updated_at || cursor;
      if (!page.has_more) break;
      if (!page.next_cursor) throw new Error("A origem informou has_more=true, mas não enviou next_cursor.");
    } while (stats.pages < 500);

    try {
      const tiny = await fillMissingCostsFromTiny(50);
      stats.tinyCostsChecked = tiny.checked;
      stats.tinyCostsUpdated = tiny.updated;
      stats.tinyCostErrors = tiny.errors;
    } catch {
      // O Tiny é apenas contingência. Uma autorização expirada não invalida
      // os produtos, fotos e descrições já importados do sistema de mídia.
      stats.tinyCostErrors += 1;
    }

    await execute(`
      UPDATE sync_runs
      SET status = 'success', cursor_value = ?, stats_json = ?, finished_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [cursor, JSON.stringify(stats), runId]);
    return stats;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida na sincronização.";
    await execute(`
      UPDATE sync_runs
      SET status = 'error', cursor_value = ?, stats_json = ?, error_message = ?, finished_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [cursor, JSON.stringify(stats), message, runId]);
    throw error;
  }
}
