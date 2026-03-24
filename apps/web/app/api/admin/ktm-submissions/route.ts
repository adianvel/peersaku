import { NextResponse } from "next/server";

import { dbService } from "@/lib/server/db-service";

export async function GET() {
  const submissions = await dbService.listKtmSubmissions();
  return NextResponse.json({
    ok: true,
    data: submissions,
  });
}
