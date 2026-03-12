import { NextResponse } from "next/server";
import { z } from "zod";

import { phase2MockDb } from "@/lib/server/mock-db";

const quoteSchema = z.object({
  amountIdr: z.number().positive(),
  usdcIdrRate: z.number().positive().default(16_000),
  feeBps: z.number().int().min(0).max(500).default(150),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = quoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Payload quote tidak valid",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const feeIdr = Math.floor((parsed.data.amountIdr * parsed.data.feeBps) / 10_000);
  const netIdr = parsed.data.amountIdr - feeIdr;
  const usdcRequired = Number((parsed.data.amountIdr / parsed.data.usdcIdrRate).toFixed(2));

  phase2MockDb.appendAuditEvent({
    source: "xendit",
    type: "quote.created",
    payload: {
      amountIdr: parsed.data.amountIdr,
      usdcIdrRate: parsed.data.usdcIdrRate,
      feeBps: parsed.data.feeBps,
      usdcRequired,
      feeIdr,
      netIdr,
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      grossIdr: parsed.data.amountIdr,
      feeIdr,
      netIdr,
      usdcRequired,
      exchangeRate: parsed.data.usdcIdrRate,
    },
    message: "Quote disbursement sandbox berhasil dibuat (mock mode).",
  });
}
