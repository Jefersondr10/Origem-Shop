import {NextResponse} from "next/server";
import {z} from "zod";
import {requestIsAdmin} from "@/lib/auth";
import {dbExecute} from "@/lib/db";

const machineSchema = z.object({name: z.string().min(1).max(191), publicName: z.string().max(191).optional()});
const brandSchema = z.object({name: z.string().min(1).max(191), logoUrl: z.string().max(2000).optional()});
const rateSchema = z.object({machineId: z.coerce.number().int().positive(), brandId: z.coerce.number().int().positive(), installments: z.coerce.number().int().min(1).max(24), percentageRate: z.coerce.number().min(0).max(99), fixedRate: z.coerce.number().min(0), minimumAmount: z.coerce.number().min(0), passFeeToCustomer: z.boolean()});

export async function POST(request: Request) {
  if (!requestIsAdmin(request)) return NextResponse.json({error: "Não autorizado"}, {status: 401});
  try {
    const body = await request.json();
    if (body.kind === "machine") {
      const value = machineSchema.parse(body.payload);
      await dbExecute("INSERT INTO payment_machines (name, public_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE public_name = VALUES(public_name), active = 1", [value.name, value.publicName || null]);
    } else if (body.kind === "brand") {
      const value = brandSchema.parse(body.payload);
      await dbExecute("INSERT INTO card_brands (name, logo_url) VALUES (?, ?) ON DUPLICATE KEY UPDATE logo_url = VALUES(logo_url), active = 1", [value.name, value.logoUrl || null]);
    } else if (body.kind === "rate") {
      const value = rateSchema.parse(body.payload);
      await dbExecute(`INSERT INTO installment_rates (machine_id, card_brand_id, installments, percentage_rate, fixed_rate, minimum_amount, pass_fee_to_customer)
        VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE percentage_rate = VALUES(percentage_rate), fixed_rate = VALUES(fixed_rate), minimum_amount = VALUES(minimum_amount), pass_fee_to_customer = VALUES(pass_fee_to_customer), active = 1`,
        [value.machineId, value.brandId, value.installments, value.percentageRate, value.fixedRate, value.minimumAmount, value.passFeeToCustomer ? 1 : 0]);
    } else throw new Error("Tipo de cadastro inválido");
    return NextResponse.json({ok: true});
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : "Dados inválidos"}, {status: 400});
  }
}
