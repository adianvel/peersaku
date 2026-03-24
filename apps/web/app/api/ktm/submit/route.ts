import { NextResponse } from "next/server";
import { z } from "zod";

import { dbService } from "@/lib/server/db-service";

const submitKtmSchema = z.object({
  userId: z.string().uuid(),
  university: z.string().min(2),
  major: z.string().min(2),
  studentIdNum: z.string().min(5).max(50),
  enrollmentYear: z.number().int().min(2000).max(new Date().getFullYear()),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = submitKtmSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Payload verifikasi KTM tidak valid",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const user = await dbService.findUserById(parsed.data.userId);

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "User tidak ditemukan",
      },
      { status: 404 },
    );
  }

  const submission = await dbService.createKtmSubmission(parsed.data);

  return NextResponse.json(
    {
      ok: true,
      data: submission,
      message: "KTM submission diterima. Menunggu review admin.",
    },
    { status: 201 },
  );
}
