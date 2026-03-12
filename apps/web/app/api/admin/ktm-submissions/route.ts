import { NextResponse } from "next/server";

import { phase2MockDb } from "@/lib/server/mock-db";

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: phase2MockDb.listKtmSubmissions(),
  });
}
