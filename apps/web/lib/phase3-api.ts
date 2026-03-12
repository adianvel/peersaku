export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type AnalyticsSummary = {
  totalEvents: number;
  counts: Record<string, number>;
  conversion: {
    registerCompletionRate: number;
    ktmCompletionFromRegisterRate: number;
    loanCreationFromKtmRate: number;
    fundingCompletionFromLoanRate: number;
  };
};

export type UserRecord = {
  id: string;
  email: string;
  fullName: string;
  role: "borrower" | "lender" | "admin";
  walletAddress?: string;
  createdAt: string;
};

export type LoanStatus = "pending" | "funded" | "active" | "repaid" | "defaulted" | "cancelled";

export type LoanRecord = {
  id: string;
  borrowerId: string;
  amount: number;
  interestRate: number;
  tenorDays: number;
  purposeCategory: string;
  purposeDetail?: string;
  status: LoanStatus;
  createdAt: string;
};

export type KtmSubmissionRecord = {
  id: string;
  userId: string;
  university: string;
  major: string;
  studentIdNum: string;
  enrollmentYear: number;
  verification: "pending" | "approved" | "rejected";
  createdAt: string;
};

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!payload) {
    return {
      ok: false,
      error: `HTTP ${response.status}: response kosong`,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: payload.error ?? `HTTP ${response.status}`,
      message: payload.message,
    };
  }

  return payload;
}

export async function registerByEmail(input: {
  email: string;
  fullName: string;
  role: "borrower" | "lender";
  walletAddress?: string;
}) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<UserRecord>(response);
}

export async function requestSiwsNonce(walletAddress: string) {
  const response = await fetch("/api/auth/siws/nonce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });

  return parseResponse<{ nonce: string; message: string }>(response);
}

export async function verifySiws(input: {
  walletAddress: string;
  nonce: string;
  signature: string;
}) {
  const response = await fetch("/api/auth/siws/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<{ walletAddress: string; verified: boolean }>(response);
}

export async function submitKtm(input: {
  userId: string;
  university: string;
  major: string;
  studentIdNum: string;
  enrollmentYear: number;
}) {
  const response = await fetch("/api/ktm/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<KtmSubmissionRecord>(response);
}

export async function listKtmSubmissions() {
  const response = await fetch("/api/admin/ktm-submissions", { method: "GET" });
  return parseResponse<KtmSubmissionRecord[]>(response);
}

export async function updateKtmVerification(
  id: string,
  verification: "pending" | "approved" | "rejected",
) {
  const response = await fetch(`/api/admin/ktm-submissions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verification }),
  });

  return parseResponse<KtmSubmissionRecord>(response);
}

export async function listLoans() {
  const response = await fetch("/api/loans", { method: "GET" });
  return parseResponse<LoanRecord[]>(response);
}

export async function createLoan(input: {
  borrowerId: string;
  amount: number;
  interestRate: number;
  tenorDays: number;
  purposeCategory: "ukt" | "laptop" | "kost" | "darurat" | "lainnya";
  purposeDetail?: string;
}) {
  const response = await fetch("/api/loans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<LoanRecord>(response);
}

export async function updateLoanStatus(id: string, status: LoanStatus) {
  const response = await fetch(`/api/loans/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  return parseResponse<LoanRecord>(response);
}

export async function sendHeliusMockWebhook(input: { type: string; signature?: string }) {
  const response = await fetch("/api/webhooks/helius", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<{ received: number }>(response);
}

export async function getXenditQuote(input: {
  amountIdr: number;
  usdcIdrRate?: number;
  feeBps?: number;
}) {
  const response = await fetch("/api/disbursements/xendit/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<{
    grossIdr: number;
    feeIdr: number;
    netIdr: number;
    usdcRequired: number;
    exchangeRate: number;
  }>(response);
}

export async function getAnalyticsSummary() {
  const response = await fetch("/api/analytics/summary", { method: "GET" });
  return parseResponse<AnalyticsSummary>(response);
}
