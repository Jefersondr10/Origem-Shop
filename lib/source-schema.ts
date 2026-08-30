import {z} from "zod";

const nullableText = z.string().nullable().optional();

export const sourceBrandSchema = z.object({
  external_id: z.union([z.string(), z.number()]).transform(String),
  name: z.string().min(1),
  logo_url: nullableText,
  active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
  updated_at: nullableText,
});

export const sourceCategorySchema = z.object({
  external_id: z.union([z.string(), z.number()]).transform(String),
  parent_external_id: z.union([z.string(), z.number()]).transform(String).nullable().optional(),
  name: z.string().min(1),
  image_url: nullableText,
  active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
  updated_at: nullableText,
});

const sourceImageSchema = z.union([
  z.string(),
  z.object({
    url: z.string(),
    alt: z.string().optional(),
    position: z.number().int().optional(),
  }).passthrough(),
]);

export const sourceProductSchema = z.object({
  external_id: z.union([z.string(), z.number()]).transform(String),
  tiny_product_id: z.union([z.string(), z.number()]).transform(String).nullable().optional(),
  sku: nullableText,
  ean: nullableText,
  name: z.string().min(1),
  slug: nullableText,
  short_description: nullableText,
  description_html: nullableText,
  brand_external_id: z.union([z.string(), z.number()]).transform(String).nullable().optional(),
  category_external_id: z.union([z.string(), z.number()]).transform(String).nullable().optional(),
  images: z.array(sourceImageSchema).optional().default([]),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().default({}),
  stock_quantity: z.number().nullable().optional(),
  stock_status: z.string().optional().default("available"),
  active: z.boolean().optional().default(true),
  cost: z.number().nonnegative().nullable().optional(),
  average_cost: z.number().nonnegative().nullable().optional(),
  updated_at: nullableText,
});

export const sourcePageSchema = z.object({
  brands: z.array(sourceBrandSchema).optional().default([]),
  categories: z.array(sourceCategorySchema).optional().default([]),
  products: z.array(sourceProductSchema).optional().default([]),
  deleted_product_external_ids: z.array(z.union([z.string(), z.number()]).transform(String)).optional().default([]),
  next_cursor: z.string().nullable().optional(),
  has_more: z.boolean().optional().default(false),
  source_updated_at: nullableText,
});

export type SourcePage = z.infer<typeof sourcePageSchema>;
export type SourceProduct = z.infer<typeof sourceProductSchema>;
