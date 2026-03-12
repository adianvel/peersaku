import { NextResponse } from "next/server";
import { z } from "zod";

import { phase2MockDb } from "@/lib/server/mock-db";

const analyticsEventSchema = z.object({
  name: z.enum([
    "auth_register_started",
    "auth_register_completed",
    "auth_siws_nonce_requested",
    "auth_siws_verified",
    "ktm_submit_started",
    "ktm_submit_completed",
    "loan_create_started",
    "loan_create_completed",
    "lender_marketplace_view",
    "lender_funding_clicked",
    "lender_funding_completed",
    "loan_repaid_on_time",
  ]),
  actor: z.enum(["borrower", "lender", "admin"]).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = analyticsEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Analytics event tidak valid",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const event = phase2MockDb.appendAnalyticsEvent(parsed.data);

  return NextResponse.json(
    {
      ok: true,
      data: event,
    },
    { status: 201 },
  );
}
