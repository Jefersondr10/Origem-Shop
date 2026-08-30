import {randomBytes} from "node:crypto";
import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/auth";
import {tinyAuthorizationUrl} from "@/lib/tiny";

const STATE_COOKIE = "origem_tiny_oauth_state";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  try {
    const state = randomBytes(32).toString("base64url");
    const store = await cookies();
    store.set(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: "/",
    });
    return NextResponse.redirect(tinyAuthorizationUrl(state));
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : "Falha ao iniciar autorização do Tiny.");
    return NextResponse.redirect(new URL(`/admin/configuracoes?tiny=erro&mensagem=${message}`, request.url));
  }
}
