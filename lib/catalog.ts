import {databaseConfigured, dbQuery} from "./db";
import {parseJsonObject} from "./format";
import type {Brand, CatalogProduct, Category} from "./types";

const demoProducts: CatalogProduct[] = [
  {
    id: 1,
    externalId: "demo-attack-shark-x11",
    tinyProductId: null,
    sku: "ATTACK-SHARK-X11-BLACK",
    ean: null,
    name: "Mouse Gamer Attack Shark X11 Tri-Mode com Dock RGB",
    slug: "mouse-gamer-attack-shark-x11",
    description: "Produto demonstrativo. Faça a primeira sincronização para substituir os dados.",
    specifications: {Conexão: "2.4 GHz, Bluetooth e USB-C", Sensor: "PAW3311"},
    brand: {id: 1, externalId: "demo-brand", name: "Attack Shark", slug: "attack-shark", logoUrl: null},
    category: {id: 1, externalId: "demo-category", name: "Mouses", slug: "mouses", fullPath: "Periféricos > Mouses"},
    salePrice: 299.99,
    promotionalPrice: 279.99,
    promotionStart: null,
    promotionEnd: null,
    currentPrice: 279.99,
    featured: true,
    active: true,
    stockStatus: "in_stock",
    images: [],
  },
];

type ProductRow = {
  id: number;
  external_id: string;
  tiny_product_id: string | null;
  sku: string;
  ean: string | null;
  name: string;
  slug: string;
  description: string | null;
  specifications_json: unknown;
  cost: number | null;
  cost_source: CatalogProduct["costSource"];
  sale_price: number | null;
  promotional_price: number | null;
  promotion_start: Date | null;
  promotion_end: Date | null;
  featured: number | boolean;
  active: number | boolean;
  stock_status: CatalogProduct["stockStatus"];
  brand_id: number | null;
  brand_external_id: string | null;
  brand_name: string | null;
  brand_slug: string | null;
  brand_logo_url: string | null;
  category_id: number | null;
  category_external_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  category_full_path: string | null;
};

type ImageRow = {product_id: number; url: string};
type BrandRow = {id: number; external_id: string; name: string; slug: string; logo_url: string | null};
type CategoryRow = {id: number; external_id: string; name: string; slug: string; full_path: string | null};

function activePromotion(row: ProductRow) {
  const now = Date.now();
  if (!row.promotional_price || row.promotional_price <= 0) return false;
  if (row.promotion_start && row.promotion_start.getTime() > now) return false;
  if (row.promotion_end && row.promotion_end.getTime() < now) return false;
  return true;
}

function mapProduct(row: ProductRow, images: string[], includePrivate = false): CatalogProduct {
  const brand: Brand | null = row.brand_id && row.brand_name && row.brand_slug && row.brand_external_id ? {
    id: row.brand_id, externalId: row.brand_external_id, name: row.brand_name, slug: row.brand_slug, logoUrl: row.brand_logo_url,
  } : null;
  const category: Category | null = row.category_id && row.category_name && row.category_slug && row.category_external_id ? {
    id: row.category_id, externalId: row.category_external_id, name: row.category_name, slug: row.category_slug, fullPath: row.category_full_path,
  } : null;
  const product: CatalogProduct = {
    id: row.id,
    externalId: row.external_id,
    tinyProductId: row.tiny_product_id,
    sku: row.sku,
    ean: row.ean,
    name: row.name,
    slug: row.slug,
    description: row.description,
    specifications: parseJsonObject(row.specifications_json),
    brand,
    category,
    salePrice: row.sale_price == null ? null : Number(row.sale_price),
    promotionalPrice: row.promotional_price == null ? null : Number(row.promotional_price),
    promotionStart: row.promotion_start?.toISOString() || null,
    promotionEnd: row.promotion_end?.toISOString() || null,
    currentPrice: activePromotion(row) ? Number(row.promotional_price) : row.sale_price == null ? null : Number(row.sale_price),
    featured: Boolean(row.featured),
    active: Boolean(row.active),
    stockStatus: row.stock_status,
    images,
  };
  if (includePrivate) {
    product.cost = row.cost == null ? null : Number(row.cost);
    product.costSource = row.cost_source;
  }
  return product;
}

const selectProducts = `
  SELECT p.*, b.external_id AS brand_external_id, b.name AS brand_name, b.slug AS brand_slug, b.logo_url AS brand_logo_url,
    c.external_id AS category_external_id, c.name AS category_name, c.slug AS category_slug, c.full_path AS category_full_path
  FROM products p
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN categories c ON c.id = p.category_id`;

export async function getProducts(options: {includeInactive?: boolean; includePrivate?: boolean; limit?: number} = {}) {
  if (!databaseConfigured()) return demoProducts;
  const where = options.includeInactive ? "" : " WHERE p.active = 1 AND p.sale_price IS NOT NULL AND p.sale_price > 0";
  const limit = Math.max(1, Math.min(1000, options.limit || 500));
  const rows = await dbQuery<ProductRow>(`${selectProducts}${where} ORDER BY p.featured DESC, p.updated_at DESC LIMIT ${limit}`);
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(",");
  const imageRows = await dbQuery<ImageRow>(`SELECT product_id, url FROM product_images WHERE product_id IN (${placeholders}) ORDER BY sort_order, id`, ids);
  const images = new Map<number, string[]>();
  for (const image of imageRows) images.set(image.product_id, [...(images.get(image.product_id) || []), image.url]);
  return rows.map((row) => mapProduct(row, images.get(row.id) || [], Boolean(options.includePrivate)));
}

export async function getProductBySlug(slug: string) {
  if (!databaseConfigured()) return demoProducts.find((product) => product.slug === slug) || null;
  const rows = await dbQuery<ProductRow>(`${selectProducts} WHERE p.slug = ? AND p.active = 1 LIMIT 1`, [slug]);
  if (!rows.length) return null;
  const imageRows = await dbQuery<ImageRow>("SELECT product_id, url FROM product_images WHERE product_id = ? ORDER BY sort_order, id", [rows[0].id]);
  return mapProduct(rows[0], imageRows.map((row) => row.url));
}

export async function getBrands() {
  if (!databaseConfigured()) return demoProducts.map((product) => product.brand).filter(Boolean) as Brand[];
  const rows = await dbQuery<BrandRow>("SELECT id, external_id, name, slug, logo_url FROM brands WHERE active = 1 ORDER BY sort_order, name");
  return rows.map((row) => ({id: row.id, externalId: row.external_id, name: row.name, slug: row.slug, logoUrl: row.logo_url}));
}

export async function getCategories() {
  if (!databaseConfigured()) return demoProducts.map((product) => product.category).filter(Boolean) as Category[];
  const rows = await dbQuery<CategoryRow>("SELECT id, external_id, name, slug, full_path FROM categories WHERE active = 1 ORDER BY sort_order, name");
  return rows.map((row) => ({id: row.id, externalId: row.external_id, name: row.name, slug: row.slug, fullPath: row.full_path}));
}

export async function getDashboardStats() {
  if (!databaseConfigured()) return {total: 1, active: 1, hidden: 0, withoutPrice: 0, withoutCost: 1, promotions: 1, featured: 1};
  const rows = await dbQuery<Record<string, number>>(`SELECT COUNT(*) total,
    SUM(active = 1) active, SUM(active = 0) hidden, SUM(sale_price IS NULL OR sale_price <= 0) withoutPrice,
    SUM(cost IS NULL OR cost <= 0) withoutCost, SUM(promotional_price IS NOT NULL AND promotional_price > 0) promotions,
    SUM(featured = 1) featured FROM products`);
  const row = rows[0] || {};
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value || 0)]));
}
