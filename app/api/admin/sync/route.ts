import {NextResponse} from "next/server";
import {requestIsAdmin} from "@/lib/auth";
import {runMediaSync} from "@/lib/sync";

export const maxDuration = 300;

export async function POST(request: Request) {
  if (!requestIsAdmin(request)) return NextResponse.json({error: "Não autorizado"}, {status: 401});
  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({summary: await runMediaSync({full: Boolean(body.full)})});
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : "Falha na sincronização"}, {status: 500});
  }
}
