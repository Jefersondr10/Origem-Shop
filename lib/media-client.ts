import {z} from "zod";

const imageSchema = z.union([
  z.string().url().transform((url) => ({id: null as string | null, url, alt: null as string | null, sort_order: 0})),
  z.object({
    id: z.union([z.string(), z.number()]).optional().transform((value) => value == null ? null : String(value)),
    url: z.string().url(),
    alt: z.string().nullable().optional().default(null),
    sort_order: z.number().int().optional().default(0),
  }),
]);

const taxonomySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  name: z.string().min(1),
  slug: z.string().optional(),
  logo_url: z.string().url().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  full_path: z.string().nullable().optional(),
  parent_id: z.union([z.string(), z.number()]).nullable().optional().transform((value) => value == null ? null : String(value)),
});

const costSchema = z.object({
  registered: z.number().nullable().optional(),
  average: z.number().nullable().optional(),
  currency: z.string().optional().default("BRL"),
  updated_at: z.string().datetime().nullable().optional(),
}).nullable().optional();

const mediaProductSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  tiny_product_id: z.union([z.string(), z.number()]).nullable().optional().transform((value) => value == null ? null : String(value)),
  sku: z.string().min(1),
  ean: z.string().nullable().optional(),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  specifications: z.record(z.unknown()).optional().default({}),
  brand: taxonomySchema.nullable().optional(),
  category: taxonomySchema.nullable().optional(),
  images: z.array(imageSchema).optional().default([]),
  cost: costSchema,
  stock: z.object({
    quantity: z.number().nullable().optional(),
    status: z.enum(["in_stock", "low_stock", "out_of_stock", "unknown"]).optional(),
  }).nullable().optional(),
  active: z.boolean().optional().default(true),
  updated_at: z.string().datetime().nullable().optional(),
});

const responseSchema = z.object({
  products: z.array(mediaProductSchema),
  next_cursor: z.string().nullable().optional(),
  has_more: z.boolean().optional().default(false),
  generated_at: z.string().datetime().optional(),
});

const envelopeSchema = z.union([responseSchema, z.object({data: responseSchema})]).transform((value) => "data" in value ? value.data : value);

export type MediaProduct = z.infer<typeof mediaProductSchema>;

export async function fetchMediaProducts(cursor?: string | null, limit = 200, updatedSince?: string | null) {
  const endpoint = process.env.MEDIA_SYSTEM_API_URL;
  const token = process.env.MEDIA_SYSTEM_API_TOKEN;
  if (!endpoint || !token) throw new Error("Integração do sistema de mídia não configurada");
  const url = new URL(endpoint);
  url.searchParams.set("limit", String(Math.max(1, Math.min(500, limit))));
  if (cursor) url.searchParams.set("cursor", cursor);
  if (updatedSince) url.searchParams.set("updated_since", updatedSince);
  const response = await fetch(url, {
    headers: {Authorization: `Bearer ${token}`, Accept: "application/json"},
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Sistema de mídia respondeu ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return envelopeSchema.parse(await response.json());
}
