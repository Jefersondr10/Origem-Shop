import {createHash, timingSafeEqual} from "node:crypto";
import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/auth";
import {exchangeTinyAuthorizationCode} from "@/lib/tiny";

const STATE_COOKIE = "origem_tiny_oauth_state";

function sameValue(left: string, right: string): boolean {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const store = await cookies();
  const expectedState = store.get(STATE_COOKIE)?.value || "";
  store.delete(STATE_COOKIE);

  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code") || "";
  const state = request.nextUrl.searchParams.get("state") || "";
  if (error) {
    return NextResponse.redirect(new URL(`/admin/configuracoes?tiny=erro&mensagem=${encodeURIComponent(error)}`, request.url));
  }
  if (!expectedState || !state || !sameValue(state, expectedState) || !code) {
    return NextResponse.redirect(new URL("/admin/configuracoes?tiny=erro&mensagem=Retorno%20OAuth%20inv%C3%A1lido", request.url));
  }

  try {
    await exchangeTinyAuthorizationCode(code);
    return NextResponse.redirect(new URL("/admin/configuracoes?tiny=ok", request.url));
  } catch (exchangeError) {
    const message = encodeURIComponent(exchangeError instanceof Error ? exchangeError.message : "Falha ao conectar o Tiny.");
    return NextResponse.redirect(new URL(`/admin/configuracoes?tiny=erro&mensagem=${message}`, request.url));
  }
}
