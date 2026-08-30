import {NextRequest, NextResponse} from "next/server";
import {getInstallmentSimulation} from "@/lib/installments";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const amount = Number(request.nextUrl.searchParams.get("amount"));
  const machineId = Number(request.nextUrl.searchParams.get("machineId")) || null;
  const brandId = Number(request.nextUrl.searchParams.get("brandId")) || null;
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({error: "Valor inválido."}, {status: 400});
  }
  try {
    return NextResponse.json(await getInstallmentSimulation(amount, machineId, brandId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível calcular o parcelamento.";
    return NextResponse.json({error: message}, {status: 500});
  }
}
