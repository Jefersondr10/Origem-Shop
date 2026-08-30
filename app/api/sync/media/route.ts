import {createHash, timingSafeEqual} from "node:crypto";
import {NextRequest, NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/auth";
import {syncCatalog} from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function sameSecret(candidate: string, expected: string): boolean {
  const left = createHash("sha256").update(candidate).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

async function authorized(request: NextRequest): Promise<boolean> {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret && process.env.CRON_SECRET && sameSecret(cronSecret, process.env.CRON_SECRET)) return true;
  return isAdminAuthenticated();
}

async function requestedFullSync(request: NextRequest): Promise<boolean> {
  if (request.nextUrl.searchParams.get("full") === "1") return true;
  try {
    const body = await request.json() as {full?: unknown};
    return body.full === true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!(await authorized(request))) return NextResponse.json({error: "Não autorizado."}, {status: 401});
  const full = await requestedFullSync(request);
  try {
    return NextResponse.json({ok: true, stats: await syncCatalog({full})});
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Falha na sincronização.",
    }, {status: 500});
  }
}
