import type {RowDataPacket} from "mysql2/promise";
import {demoProducts, demoSettings} from "@/lib/demo";
import {isDatabaseConfigured, queryRows} from "@/lib/db";
import type {
  AdminBrand,
  AdminDashboard,
  AdminProduct,
  CardBrand,
  CatalogFacet,
  CatalogSettings,
  InstallmentRate,
  PaymentMachine,
  PublicProduct,
} from "@/lib/types";
import {asBoolean, asNumber, parseJson, parseSaoPauloDateTime, toDateTimeLocal} from "@/lib/utils";

interface SettingsRow extends RowDataPacket {
  catalog_name: string;
  logo_url: string | null;
  whatsapp: string;
  whatsapp_message_template: string | null;
  instagram: string;
  address: string | null;
  maps_url: string | null;
  business_hours: string | null;
  footer_text: string | null;
  max_installments: number;
  default_machine_id: number | null;
  default_card_brand_id: number | null;
}

interface ProductRow extends RowDataPacket {
  id: number;
  external_id: string;
  slug: string;
  name: string;
  sku: string | null;
  ean: string | null;
  short_description: string | null;
  description_html: string | null;
  images_json: unknown;
  attributes_json: unknown;
  stock_status: string;
  featured: number | boolean;
  sale_price: string | number | null;
  promotional_price: string | number | null;
  promotion_starts_at: Date | string | null;
  promotion_ends_at: Date | string | null;
  brand_name: string | null;
  brand_slug: string | null;
  brand_logo_url: string | null;
  category_name: string | null;
  category_slug: string | null;
}

interface AdminProductRow extends RowDataPacket {
  id: number;
  name: string;
  sku: string | null;
  brand_name: string | null;
  category_name: string | null;
  images_json: unknown;
  cost: string | number | null;
  cost_source: string;
  sale_price: string | number | null;
  promotional_price: string | number | null;
  promotion_starts_at: Date | string | null;
  promotion_ends_at: Date | string | null;
  published: number | boolean;
  featured: number | boolean;
  source_active: number | boolean;
}

function promotionIsActive(row: ProductRow): boolean {
  if (asNumber(row.promotional_price) == null) return false;
  const now = Date.now();
  const startsAt = parseSaoPauloDateTime(row.promotion_starts_at);
  const endsAt = parseSaoPauloDateTime(row.promotion_ends_at);
  return (startsAt == null || startsAt <= now) && (endsAt == null || endsAt >= now);
}

function mapPublicProduct(row: ProductRow): PublicProduct {
  const salePrice = asNumber(row.sale_price);
  const promotionalPrice = asNumber(row.promotional_price);
  const promotionActive = promotionIsActive(row);
  const images = parseJson<unknown[]>(row.images_json, [])
    .map((item) => typeof item === "string" ? item : (item && typeof item === "object" && "url" in item ? String((item as {url: unknown}).url) : ""))
    .filter(Boolean);

  return {
    id: Number(row.id),
    externalId: row.external_id,
    slug: row.slug,
    name: row.name,
    sku: row.sku || "",
    ean: row.ean || "",
    shortDescription: row.short_description || "",
    descriptionHtml: row.description_html || "",
    brand: row.brand_name || "Sem marca",
    brandSlug: row.brand_slug || "sem-marca",
    brandLogoUrl: row.brand_logo_url || "",
    category: row.category_name || "Outros",
    categorySlug: row.category_slug || "outros",
    images,
    attributes: parseJson<Record<string, string | number | boolean | null>>(row.attributes_json, {}),
    stockStatus: row.stock_status || "available",
    featured: asBoolean(row.featured),
    salePrice,
    promotionalPrice,
    effectivePrice: promotionActive ? promotionalPrice : salePrice,
    promotionActive,
  };
}

export async function getCatalogSettings(): Promise<CatalogSettings> {
  if (!isDatabaseConfigured()) return demoSettings;
  const rows = await queryRows<SettingsRow>("SELECT * FROM catalog_settings WHERE id = 1 LIMIT 1");
  const row = rows[0];
  if (!row) return demoSettings;
  return {
    catalogName: row.catalog_name || "Origem",
    logoUrl: row.logo_url || "",
    whatsapp: row.whatsapp || "",
    whatsappMessageTemplate: row.whatsapp_message_template || "Olá! Quero atendimento sobre os produtos abaixo:",
    instagram: row.instagram || "",
    address: row.address || "",
    mapsUrl: row.maps_url || "",
    businessHours: row.business_hours || "",
    footerText: row.footer_text || "",
    maxInstallments: Number(row.max_installments || 12),
    defaultMachineId: row.default_machine_id ? Number(row.default_machine_id) : null,
    defaultCardBrandId: row.default_card_brand_id ? Number(row.default_card_brand_id) : null,
  };
}

export async function getPublicProducts(): Promise<PublicProduct[]> {
  if (!isDatabaseConfigured()) return demoProducts;
  const rows = await queryRows<ProductRow>(`
    SELECT p.id, p.external_id, p.slug, p.name, p.sku, p.ean,
      p.short_description, p.description_html, p.images_json, p.attributes_json,
      p.stock_status, p.featured, p.sale_price, p.promotional_price,
      p.promotion_starts_at, p.promotion_ends_at,
      b.name AS brand_name, b.slug AS brand_slug,
      COALESCE(b.manual_logo_url, b.source_logo_url) AS brand_logo_url,
      c.name AS category_name, c.slug AS category_slug
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.published = 1
      AND p.source_active = 1
      AND p.archived_at IS NULL
      AND p.stock_status NOT IN ('unavailable', 'out_of_stock')
    ORDER BY p.featured DESC, p.updated_at DESC, p.name ASC
  `);
  return rows.map(mapPublicProduct);
}

export async function getPublicProductBySlug(slug: string): Promise<PublicProduct | null> {
  if (!isDatabaseConfigured()) return demoProducts.find((product) => product.slug === slug) || null;
  const rows = await queryRows<ProductRow>(`
    SELECT p.id, p.external_id, p.slug, p.name, p.sku, p.ean,
      p.short_description, p.description_html, p.images_json, p.attributes_json,
      p.stock_status, p.featured, p.sale_price, p.promotional_price,
      p.promotion_starts_at, p.promotion_ends_at,
      b.name AS brand_name, b.slug AS brand_slug,
      COALESCE(b.manual_logo_url, b.source_logo_url) AS brand_logo_url,
      c.name AS category_name, c.slug AS category_slug
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.slug = ? AND p.published = 1 AND p.source_active = 1 AND p.archived_at IS NULL
      AND p.stock_status NOT IN ('unavailable', 'out_of_stock')
    LIMIT 1
  `, [slug]);
  return rows[0] ? mapPublicProduct(rows[0]) : null;
}

export function buildFacets(products: PublicProduct[], field: "brand" | "category"): CatalogFacet[] {
  const map = new Map<string, CatalogFacet>();
  for (const product of products) {
    const slug = field === "brand" ? product.brandSlug : product.categorySlug;
    const name = field === "brand" ? product.brand : product.category;
    const logoUrl = field === "brand" ? product.brandLogoUrl : undefined;
    const current = map.get(slug);
    if (current) current.count += 1;
    else map.set(slug, {id: map.size + 1, name, slug, logoUrl, count: 1});
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  if (!isDatabaseConfigured()) {
    return {
      totalProducts: demoProducts.length,
      publishedProducts: demoProducts.length,
      hiddenProducts: 0,
      withoutPrice: demoProducts.filter((item) => item.effectivePrice == null).length,
      withoutCost: demoProducts.length,
      withoutImage: demoProducts.filter((item) => item.images.length === 0).length,
      withoutBrand: demoProducts.filter((item) => !item.brand).length,
      withoutCategory: demoProducts.filter((item) => !item.category).length,
      featured: demoProducts.filter((item) => item.featured).length,
      promotions: demoProducts.filter((item) => item.promotionActive).length,
      lastSync: null,
    };
  }

  const [summary] = await queryRows<RowDataPacket & Record<string, number | string>>(String.raw`
    SELECT
      COUNT(*) AS total_products,
      SUM(published = 1 AND source_active = 1 AND archived_at IS NULL) AS published_products,
      SUM(published = 0 OR source_active = 0 OR archived_at IS NOT NULL) AS hidden_products,
      SUM(sale_price IS NULL) AS without_price,
      SUM(cost IS NULL) AS without_cost,
      SUM(images_json IS NULL OR JSON_LENGTH(images_json) = 0) AS without_image,
      SUM(brand_id IS NULL) AS without_brand,
      SUM(category_id IS NULL) AS without_category,
      SUM(featured = 1) AS featured,
      SUM(promotional_price IS NOT NULL
        AND (promotion_starts_at IS NULL OR promotion_starts_at <= CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '-03:00'))
        AND (promotion_ends_at IS NULL OR promotion_ends_at >= CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '-03:00'))) AS promotions
    FROM products
  `);

  const [lastSync] = await queryRows<RowDataPacket & Record<string, unknown>>(String.raw`
    SELECT status, started_at, finished_at, stats_json, error_message
    FROM sync_runs
    ORDER BY id DESC
    LIMIT 1
  `);

  return {
    totalProducts: Number(summary?.total_products || 0),
    publishedProducts: Number(summary?.published_products || 0),
    hiddenProducts: Number(summary?.hidden_products || 0),
    withoutPrice: Number(summary?.without_price || 0),
    withoutCost: Number(summary?.without_cost || 0),
    withoutImage: Number(summary?.without_image || 0),
    withoutBrand: Number(summary?.without_brand || 0),
    withoutCategory: Number(summary?.without_category || 0),
    featured: Number(summary?.featured || 0),
    promotions: Number(summary?.promotions || 0),
    lastSync: lastSync ? {
      status: String(lastSync.status || ""),
      startedAt: lastSync.started_at ? new Date(String(lastSync.started_at)).toLocaleString("pt-BR") : "",
      finishedAt: lastSync.finished_at ? new Date(String(lastSync.finished_at)).toLocaleString("pt-BR") : "",
      stats: parseJson<Record<string, unknown>>(lastSync.stats_json, {}),
      errorMessage: String(lastSync.error_message || ""),
    } : null,
  };
}

export async function getAdminProducts(search = ""): Promise<AdminProduct[]> {
  if (!isDatabaseConfigured()) {
    return demoProducts.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      category: product.category,
      image: product.images[0] || "",
      cost: null,
      costSource: "demo",
      salePrice: product.salePrice,
      promotionalPrice: product.promotionalPrice,
      promotionStartsAt: "",
      promotionEndsAt: "",
      published: true,
      featured: product.featured,
      sourceActive: true,
    }));
  }

  const like = `%${search.trim()}%`;
  const rows = await queryRows<AdminProductRow>(`
    SELECT p.id, p.name, p.sku, p.images_json, p.cost, p.cost_source,
      p.sale_price, p.promotional_price, p.promotion_starts_at, p.promotion_ends_at,
      p.published, p.featured, p.source_active,
      b.name AS brand_name, c.name AS category_name
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE (? = '%%' OR p.name LIKE ? OR p.sku LIKE ? OR p.ean LIKE ?)
    ORDER BY p.updated_at DESC, p.name ASC
    LIMIT 250
  `, [like, like, like, like]);

  return rows.map((row) => {
    const images = parseJson<unknown[]>(row.images_json, []);
    const firstImage = images[0];
    return {
      id: Number(row.id),
      name: row.name,
      sku: row.sku || "",
      brand: row.brand_name || "Sem marca",
      category: row.category_name || "Outros",
      image: typeof firstImage === "string" ? firstImage : (firstImage && typeof firstImage === "object" && "url" in firstImage ? String((firstImage as {url: unknown}).url) : ""),
      cost: asNumber(row.cost),
      costSource: row.cost_source || "unknown",
      salePrice: asNumber(row.sale_price),
      promotionalPrice: asNumber(row.promotional_price),
      promotionStartsAt: toDateTimeLocal(row.promotion_starts_at),
      promotionEndsAt: toDateTimeLocal(row.promotion_ends_at),
      published: asBoolean(row.published),
      featured: asBoolean(row.featured),
      sourceActive: asBoolean(row.source_active),
    };
  });
}

interface MachineRow extends RowDataPacket {
  id: number;
  name: string;
  public_name: string | null;
  active: number | boolean;
  pass_fee_to_customer: number | boolean;
  sort_order: number;
}

interface BrandRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  active: number | boolean;
  sort_order: number;
}

interface RateRow extends RowDataPacket {
  id: number;
  machine_id: number;
  machine_name: string;
  machine_public_name: string | null;
  pass_fee_to_customer: number | boolean;
  card_brand_id: number;
  card_brand_name: string;
  card_brand_logo_url: string | null;
  installments: number;
  percent_rate: string | number;
  fixed_fee: string | number;
  minimum_total: string | number;
  active: number | boolean;
}

export async function getPaymentAdminData(): Promise<{machines: PaymentMachine[]; cardBrands: CardBrand[]; rates: InstallmentRate[]}> {
  if (!isDatabaseConfigured()) return {machines: [], cardBrands: [], rates: []};
  const [machineRows, brandRows, rateRows] = await Promise.all([
    queryRows<MachineRow>("SELECT * FROM payment_machines ORDER BY sort_order, name"),
    queryRows<BrandRow>("SELECT * FROM card_brands ORDER BY sort_order, name"),
    queryRows<RateRow>(`
      SELECT r.id, r.machine_id, m.name AS machine_name, m.public_name AS machine_public_name,
        m.pass_fee_to_customer, r.card_brand_id, b.name AS card_brand_name,
        b.logo_url AS card_brand_logo_url, r.installments, r.percent_rate,
        r.fixed_fee, r.minimum_total, r.active
      FROM installment_rates r
      JOIN payment_machines m ON m.id = r.machine_id
      JOIN card_brands b ON b.id = r.card_brand_id
      ORDER BY m.sort_order, m.name, b.sort_order, b.name, r.installments
    `),
  ]);

  return {
    machines: machineRows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      publicName: row.public_name || "",
      active: asBoolean(row.active),
      passFeeToCustomer: asBoolean(row.pass_fee_to_customer),
      sortOrder: Number(row.sort_order || 0),
    })),
    cardBrands: brandRows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      slug: row.slug,
      logoUrl: row.logo_url || "",
      active: asBoolean(row.active),
      sortOrder: Number(row.sort_order || 0),
    })),
    rates: rateRows.map((row) => ({
      id: Number(row.id),
      machineId: Number(row.machine_id),
      machineName: row.machine_name,
      machinePublicName: row.machine_public_name || "",
      passFeeToCustomer: asBoolean(row.pass_fee_to_customer),
      cardBrandId: Number(row.card_brand_id),
      cardBrandName: row.card_brand_name,
      cardBrandLogoUrl: row.card_brand_logo_url || "",
      installments: Number(row.installments),
      percentRate: Number(row.percent_rate || 0),
      fixedFee: Number(row.fixed_fee || 0),
      minimumTotal: Number(row.minimum_total || 0),
      active: asBoolean(row.active),
    })),
  };
}


interface AdminBrandRow extends RowDataPacket {
  id: number;
  name: string;
  source_logo_url: string | null;
  manual_logo_url: string | null;
  active: number | boolean;
  product_count: number | string;
}

export async function getAdminBrands(): Promise<AdminBrand[]> {
  if (!isDatabaseConfigured()) {
    const grouped = new Map<string, AdminBrand>();
    for (const product of demoProducts) {
      const current = grouped.get(product.brand);
      if (current) current.productCount += 1;
      else grouped.set(product.brand, {id: grouped.size + 1, name: product.brand, sourceLogoUrl: product.brandLogoUrl, manualLogoUrl: "", effectiveLogoUrl: product.brandLogoUrl, active: true, productCount: 1});
    }
    return [...grouped.values()];
  }
  const rows = await queryRows<AdminBrandRow>(`
    SELECT b.id, b.name, b.source_logo_url, b.manual_logo_url, b.active, COUNT(p.id) AS product_count
    FROM brands b
    LEFT JOIN products p ON p.brand_id = b.id AND p.archived_at IS NULL
    GROUP BY b.id, b.name, b.source_logo_url, b.manual_logo_url, b.active
    ORDER BY b.name
  `);
  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    sourceLogoUrl: row.source_logo_url || "",
    manualLogoUrl: row.manual_logo_url || "",
    effectiveLogoUrl: row.manual_logo_url || row.source_logo_url || "",
    active: asBoolean(row.active),
    productCount: Number(row.product_count || 0),
  }));
}
