import { NextResponse } from "next/server";
import { z } from "zod";

import { dbService } from "@/lib/server/db-service";

const updateStatusSchema = z.object({
  status: z.enum(["pending", "funded", "active", "repaid", "defaulted", "cancelled"]),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { id } = await params;
  const loan = await dbService.getLoanById(id);

  if (!loan) {
    return NextResponse.json(
      {
        ok: false,
        error: "Loan tidak ditemukan",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, data: loan });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Status loan tidak valid",
      },
      { status: 400 },
    );
  }

  const updated = await dbService.updateLoanStatus(id, parsed.data.status);

  if (!updated) {
    return NextResponse.json(
      {
        ok: false,
        error: "Loan tidak ditemukan",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: updated,
    message: "Status loan berhasil diupdate",
  });
}
