import {NextResponse} from "next/server";
import {ADMIN_COOKIE, createAdminSession, passwordIsValid} from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") || "");
  if (!passwordIsValid(password)) return NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303);
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, createAdminSession(), {httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 12});
  return response;
}
