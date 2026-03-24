import { NextResponse } from "next/server";
import { z } from "zod";

import { dbService } from "@/lib/server/db-service";

const createLoanSchema = z.object({
  borrowerId: z.string().uuid(),
  amount: z.number().int().min(500_000).max(10_000_000),
  interestRate: z.number().int().min(800).max(2500),
  tenorDays: z.number().int().min(30).max(180),
  purposeCategory: z.enum(["ukt", "laptop", "kost", "darurat", "lainnya"]),
  purposeDetail: z.string().min(5).max(500).optional(),
});

export async function GET() {
  const loans = await dbService.listLoans();
  return NextResponse.json({
    ok: true,
    data: loans,
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

  const borrower = await dbService.findUserById(parsed.data.borrowerId);

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

  const loan = await dbService.createLoan(parsed.data);

  return NextResponse.json(
    {
      ok: true,
      data: loan,
      message: "Loan request berhasil dibuat",
    },
    { status: 201 },
  );
}
