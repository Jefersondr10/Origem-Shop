import {NextResponse} from "next/server";
import {isDatabaseConfigured, queryRows} from "@/lib/db";
import type {RowDataPacket} from "mysql2/promise";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({status: "demo", database: "not_configured", timestamp: new Date().toISOString()});
  }
  try {
    await queryRows<RowDataPacket>("SELECT 1 AS ok");
    return NextResponse.json({status: "ok", database: "connected", timestamp: new Date().toISOString()});
  } catch (error) {
    return NextResponse.json({
      status: "error",
      database: "unavailable",
      message: error instanceof Error ? error.message : "Erro de banco",
      timestamp: new Date().toISOString(),
    }, {status: 503});
  }
}
