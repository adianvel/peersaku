import { NextResponse } from "next/server";
import { z } from "zod";

import { phase2MockDb } from "@/lib/server/mock-db";

const createLoanSchema = z.object({
  borrowerId: z.string().uuid(),
  amount: z.number().int().min(500_000).max(10_000_000),
  interestRate: z.number().int().min(800).max(2500),
  tenorDays: z.number().int().min(30).max(180),
  purposeCategory: z.enum(["ukt", "laptop", "kost", "darurat", "lainnya"]),
  purposeDetail: z.string().min(5).max(500).optional(),
});

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: phase2MockDb.listLoans(),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createLoanSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Payload loan tidak valid",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const borrower = phase2MockDb.listUsers().find((user) => user.id === parsed.data.borrowerId);

  if (!borrower) {
    return NextResponse.json(
      {
        ok: false,
        error: "Borrower tidak ditemukan",
      },
      { status: 404 },
    );
  }

  if (borrower.role !== "borrower") {
    return NextResponse.json(
      {
        ok: false,
        error: "User bukan borrower",
      },
      { status: 403 },
    );
  }

  const loan = phase2MockDb.createLoan(parsed.data);

  return NextResponse.json(
    {
      ok: true,
      data: loan,
      message: "Loan request berhasil dibuat",
    },
    { status: 201 },
  );
}
