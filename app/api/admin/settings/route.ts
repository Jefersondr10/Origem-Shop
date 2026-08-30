import {NextResponse} from "next/server";
import {z} from "zod";
import {requestIsAdmin} from "@/lib/auth";
import {updateSettings} from "@/lib/settings";

const schema = z.object({
  catalogName: z.string().min(1).max(100),
  catalogTagline: z.string().max(300),
  catalogLogoUrl: z.string().max(2000),
  whatsappNumber: z.string().max(30),
  whatsappMessage: z.string().max(1000),
  instagramHandle: z.string().max(100),
  address: z.string().max(500),
  mapUrl: z.string().max(2000),
  businessHours: z.string().max(300),
  footerText: z.string().max(500),
  maxInstallments: z.number().int().min(1).max(24),
  showMachineName: z.boolean(),
});

export async function PUT(request: Request) {
  if (!requestIsAdmin(request)) return NextResponse.json({error: "Não autorizado"}, {status: 401});
  try {
    return NextResponse.json({settings: await updateSettings(schema.parse(await request.json()))});
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : "Dados inválidos"}, {status: 400});
  }
}
