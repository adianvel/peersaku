import { NextResponse } from "next/server";

import { dbService } from "@/lib/server/db-service";

export async function GET() {
  const summary = await dbService.getAnalyticsSummary();
  return NextResponse.json({
    ok: true,
    data: summary,
  });
}
