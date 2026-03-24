import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { dbService } from "@/lib/server/db-service";

const nonceSchema = z.object({
  walletAddress: z.string().min(32).max(64),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = nonceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "walletAddress wajib diisi",
      },
      { status: 400 },
    );
  }

  const nonce = randomBytes(16).toString("hex");
  await dbService.setSiwsNonce(parsed.data.walletAddress, nonce);

  return NextResponse.json({
    ok: true,
    data: {
      nonce,
      message: "Sign this nonce with your wallet",
    },
  });
}
