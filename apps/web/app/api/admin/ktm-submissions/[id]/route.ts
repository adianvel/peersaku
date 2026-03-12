import { NextResponse } from "next/server";
import { z } from "zod";

import { phase2MockDb } from "@/lib/server/mock-db";

const updateSchema = z.object({
  verification: z.enum(["pending", "approved", "rejected"]),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Status verifikasi tidak valid",
      },
      { status: 400 },
    );
  }

  const updated = phase2MockDb.updateKtmSubmissionVerification(id, parsed.data.verification);

  if (!updated) {
    return NextResponse.json(
      {
        ok: false,
        error: "Submission tidak ditemukan",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: updated,
    message: "Status verifikasi berhasil diperbarui",
  });
}
