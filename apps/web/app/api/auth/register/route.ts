import { NextResponse } from "next/server";
import { z } from "zod";

import { dbService } from "@/lib/server/db-service";

const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(3).max(255),
  role: z.enum(["borrower", "lender"]),
  walletAddress: z.string().min(32).max(64).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Payload tidak valid",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const existing = await dbService.findUserByEmail(parsed.data.email);

  if (existing) {
    return NextResponse.json(
      {
        ok: false,
        error: "Email sudah terdaftar",
      },
      { status: 409 },
    );
  }

  const user = await dbService.createUser(parsed.data);

  await dbService.appendAuditEvent({
    source: "auth",
    type: "register.email",
    payload: {
      userId: user.id,
      role: user.role,
      hasWallet: Boolean(user.walletAddress),
    },
  });

  return NextResponse.json(
    {
      ok: true,
      data: user,
      message: "Registrasi berhasil.",
    },
    { status: 201 },
  );
}
