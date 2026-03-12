import { NextResponse } from "next/server";
import { z } from "zod";

import { phase2MockDb } from "@/lib/server/mock-db";

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

  const existing = phase2MockDb
    .listUsers()
    .find((user) => user.email.toLowerCase() === parsed.data.email.toLowerCase());

  if (existing) {
    return NextResponse.json(
      {
        ok: false,
        error: "Email sudah terdaftar",
      },
      { status: 409 },
    );
  }

  const user = phase2MockDb.createUser(parsed.data);

  phase2MockDb.appendAuditEvent({
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
      message: "Registrasi berhasil (mock mode).",
    },
    { status: 201 },
  );
}
