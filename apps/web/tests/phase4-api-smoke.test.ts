import { beforeEach, describe, expect, it } from "vitest";

import { POST as registerPost } from "../app/api/auth/register/route";
import { POST as analyticsEventPost } from "../app/api/analytics/events/route";
import { GET as analyticsSummaryGet } from "../app/api/analytics/summary/route";
import { GET as adminKtmGet } from "../app/api/admin/ktm-submissions/route";
import { PATCH as adminKtmPatch } from "../app/api/admin/ktm-submissions/[id]/route";
import { POST as ktmSubmitPost } from "../app/api/ktm/submit/route";
import { GET as loansGet, POST as loansPost } from "../app/api/loans/route";
import { phase2MockDb } from "../lib/server/mock-db";

function jsonRequest(url: string, body: unknown, method: string = "POST") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Phase 4 API smoke", () => {
  beforeEach(() => {
    phase2MockDb.reset();
  });

  it("register endpoint creates a borrower", async () => {
    const response = await registerPost(
      jsonRequest("http://localhost/api/auth/register", {
        email: "new-borrower@peersaku.local",
        fullName: "New Borrower",
        role: "borrower",
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.data.email).toBe("new-borrower@peersaku.local");
  });

  it("loan endpoints can create and list loan data", async () => {
    const borrower = phase2MockDb.listUsers().find((user) => user.role === "borrower");
    expect(borrower).toBeTruthy();

    const createResponse = await loansPost(
      jsonRequest("http://localhost/api/loans", {
        borrowerId: borrower?.id,
        amount: 2_500_000,
        interestRate: 1200,
        tenorDays: 90,
        purposeCategory: "ukt",
        purposeDetail: "Pembayaran UKT",
      }),
    );

    const createPayload = await createResponse.json();
    expect(createResponse.status).toBe(201);
    expect(createPayload.ok).toBe(true);

    const listResponse = await loansGet();
    const listPayload = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listPayload.ok).toBe(true);
    expect(Array.isArray(listPayload.data)).toBe(true);
    expect(listPayload.data.length).toBeGreaterThan(0);
  });

  it("admin KTM queue can list and verify submission", async () => {
    const borrower = phase2MockDb.listUsers().find((user) => user.role === "borrower");
    expect(borrower).toBeTruthy();

    const submitResponse = await ktmSubmitPost(
      jsonRequest("http://localhost/api/ktm/submit", {
        userId: borrower?.id,
        university: "Universitas Indonesia",
        major: "Sistem Informasi",
        studentIdNum: "2026123456",
        enrollmentYear: 2024,
      }),
    );

    const submitPayload = await submitResponse.json();
    expect(submitResponse.status).toBe(201);

    const listResponse = await adminKtmGet();
    const listPayload = await listResponse.json();
    expect(listPayload.ok).toBe(true);
    expect(listPayload.data.length).toBeGreaterThan(0);

    const submissionId = submitPayload.data.id as string;
    const patchResponse = await adminKtmPatch(
      jsonRequest(
        `http://localhost/api/admin/ktm-submissions/${submissionId}`,
        { verification: "approved" },
        "PATCH",
      ),
      { params: Promise.resolve({ id: submissionId }) },
    );

    const patchPayload = await patchResponse.json();
    expect(patchResponse.status).toBe(200);
    expect(patchPayload.ok).toBe(true);
    expect(patchPayload.data.verification).toBe("approved");
  });

  it("analytics endpoints store events and compute funnel summary", async () => {
    const events = [
      { name: "auth_register_started", actor: "borrower" },
      { name: "auth_register_completed", actor: "borrower" },
      { name: "ktm_submit_completed", actor: "borrower" },
      { name: "loan_create_completed", actor: "borrower" },
      { name: "lender_funding_completed", actor: "lender" },
    ] as const;

    for (const event of events) {
      const response = await analyticsEventPost(
        jsonRequest("http://localhost/api/analytics/events", event),
      );
      expect(response.status).toBe(201);
    }

    const summaryResponse = await analyticsSummaryGet();
    const summaryPayload = await summaryResponse.json();

    expect(summaryResponse.status).toBe(200);
    expect(summaryPayload.ok).toBe(true);
    expect(summaryPayload.data.counts.auth_register_started).toBe(1);
    expect(summaryPayload.data.counts.lender_funding_completed).toBe(1);
    expect(summaryPayload.data.conversion.registerCompletionRate).toBe(100);
    expect(summaryPayload.data.conversion.loanCreationFromKtmRate).toBe(100);
  });
});
