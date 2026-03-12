import { NextResponse } from "next/server";
import { z } from "zod";

import { phase2MockDb } from "@/lib/server/mock-db";

const verifySchema = z.object({
  walletAddress: z.string().min(32).max(64),
  nonce: z.string().min(8),
  signature: z.string().min(32),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Payload SIWS tidak valid",
      },
      { status: 400 },
    );
  }

  const expectedNonce = phase2MockDb.consumeSiwsNonce(parsed.data.walletAddress);

  if (!expectedNonce || expectedNonce !== parsed.data.nonce) {
    return NextResponse.json(
      {
        ok: false,
        error: "Nonce invalid atau expired",
      },
      { status: 401 },
    );
  }

  phase2MockDb.appendAuditEvent({
    source: "auth",
    type: "siws.verified",
    payload: {
      walletAddress: parsed.data.walletAddress,
      signaturePreview: `${parsed.data.signature.slice(0, 8)}...`,
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      walletAddress: parsed.data.walletAddress,
      verified: true,
    },
  });
}
