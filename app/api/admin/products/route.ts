import {NextResponse} from "next/server";
import {z} from "zod";
import {requestIsAdmin} from "@/lib/auth";
import {dbExecute} from "@/lib/db";

const schema = z.object({
  id: z.number().int().positive(),
  salePrice: z.number().nonnegative().nullable().optional(),
  promotionalPrice: z.number().nonnegative().nullable().optional(),
  promotionStart: z.string().datetime().nullable().optional(),
  promotionEnd: z.string().datetime().nullable().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  if (!requestIsAdmin(request)) return NextResponse.json({error: "Não autorizado"}, {status: 401});
  try {
    const input = schema.parse(await request.json());
    await dbExecute(`UPDATE products SET sale_price = ?, promotional_price = ?, promotion_start = ?, promotion_end = ?,
      featured = ?, active = ?, price_locked = 1, updated_at = NOW(3) WHERE id = ?`, [
      input.salePrice ?? null,
      input.promotionalPrice ?? null,
      input.promotionStart ? new Date(input.promotionStart) : null,
      input.promotionEnd ? new Date(input.promotionEnd) : null,
      input.featured ? 1 : 0,
      input.active === false ? 0 : 1,
      input.id,
    ]);
    return NextResponse.json({ok: true});
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : "Dados inválidos"}, {status: 400});
  }
}
