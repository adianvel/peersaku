import { randomUUID } from "node:crypto";

export type UserRole = "borrower" | "lender" | "admin";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type LoanStatus = "pending" | "funded" | "active" | "repaid" | "defaulted" | "cancelled";

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  walletAddress?: string;
  createdAt: string;
}

export interface LoanRecord {
  id: string;
  borrowerId: string;
  amount: number;
  interestRate: number;
  tenorDays: number;
  purposeCategory: string;
  purposeDetail?: string;
  status: LoanStatus;
  createdAt: string;
}

export interface KtmSubmissionRecord {
  id: string;
  userId: string;
  university: string;
  major: string;
  studentIdNum: string;
  enrollmentYear: number;
  verification: VerificationStatus;
  createdAt: string;
}

export interface AuditEventRecord {
  id: string;
  source: "helius" | "xendit" | "auth";
  type: string;
  payload: unknown;
  createdAt: string;
}

export interface AnalyticsEventRecord {
  id: string;
  name:
    | "auth_register_started"
    | "auth_register_completed"
    | "auth_siws_nonce_requested"
    | "auth_siws_verified"
    | "ktm_submit_started"
    | "ktm_submit_completed"
    | "loan_create_started"
    | "loan_create_completed"
    | "lender_marketplace_view"
    | "lender_funding_clicked"
    | "lender_funding_completed"
    | "loan_repaid_on_time";
  actor?: "borrower" | "lender" | "admin";
  meta?: Record<string, unknown>;
  createdAt: string;
}

type State = {
  users: UserRecord[];
  loans: LoanRecord[];
  ktmSubmissions: KtmSubmissionRecord[];
  auditEvents: AuditEventRecord[];
  analyticsEvents: AnalyticsEventRecord[];
  siwsNonceByWallet: Record<string, string>;
};

const globalKey = "__peersaku_phase2_state__";
const globalState = globalThis as typeof globalThis & { [globalKey]?: State };

function createSeedState(): State {
  const borrowerId = randomUUID();

  return {
    users: [
      {
        id: borrowerId,
        email: "borrower@peersaku.local",
        fullName: "Borrower Demo",
        role: "borrower",
        walletAddress: "DemoWallet1111111111111111111111111111111111",
        createdAt: new Date().toISOString(),
      },
    ],
    loans: [
      {
        id: randomUUID(),
        borrowerId,
        amount: 2_000_000,
        interestRate: 1200,
        tenorDays: 90,
        purposeCategory: "ukt",
        purposeDetail: "Pembayaran UKT semester berjalan",
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ],
    ktmSubmissions: [],
    auditEvents: [],
    analyticsEvents: [],
    siwsNonceByWallet: {},
  };
}

function getState(): State {
  if (!globalState[globalKey]) {
    globalState[globalKey] = createSeedState();
  }

  return globalState[globalKey];
}

export const phase2MockDb = {
  reset() {
    globalState[globalKey] = createSeedState();
    return globalState[globalKey];
  },
  listUsers() {
    return getState().users;
  },
  createUser(input: Omit<UserRecord, "id" | "createdAt">) {
    const user: UserRecord = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };

    getState().users.push(user);
    return user;
  },
  listLoans() {
    return getState().loans;
  },
  createLoan(input: Omit<LoanRecord, "id" | "createdAt" | "status">) {
    const loan: LoanRecord = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: "pending",
      ...input,
    };

    getState().loans.push(loan);
    return loan;
  },
  getLoanById(id: string) {
    return getState().loans.find((loan) => loan.id === id) ?? null;
  },
  updateLoanStatus(id: string, status: LoanStatus) {
    const loan = getState().loans.find((item) => item.id === id);

    if (!loan) {
      return null;
    }

    loan.status = status;
    return loan;
  },
  createKtmSubmission(input: Omit<KtmSubmissionRecord, "id" | "createdAt" | "verification">) {
    const submission: KtmSubmissionRecord = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      verification: "pending",
      ...input,
    };

    getState().ktmSubmissions.push(submission);
    return submission;
  },
  listKtmSubmissions() {
    return getState().ktmSubmissions;
  },
  updateKtmSubmissionVerification(id: string, verification: VerificationStatus) {
    const submission = getState().ktmSubmissions.find((item) => item.id === id);

    if (!submission) {
      return null;
    }

    submission.verification = verification;
    return submission;
  },
  setSiwsNonce(walletAddress: string, nonce: string) {
    getState().siwsNonceByWallet[walletAddress] = nonce;
  },
  consumeSiwsNonce(walletAddress: string) {
    const nonce = getState().siwsNonceByWallet[walletAddress];
    delete getState().siwsNonceByWallet[walletAddress];
    return nonce;
  },
  appendAuditEvent(input: Omit<AuditEventRecord, "id" | "createdAt">) {
    const event: AuditEventRecord = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };

    getState().auditEvents.push(event);
    return event;
  },
  appendAnalyticsEvent(input: Omit<AnalyticsEventRecord, "id" | "createdAt">) {
    const event: AnalyticsEventRecord = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };

    getState().analyticsEvents.push(event);
    return event;
  },
  listAnalyticsEvents() {
    return getState().analyticsEvents;
  },
  getAnalyticsSummary() {
    const events = getState().analyticsEvents;

    const count = (name: AnalyticsEventRecord["name"]) =>
      events.filter((event) => event.name === name).length;

    const registerStarted = count("auth_register_started");
    const registerCompleted = count("auth_register_completed");
    const ktmCompleted = count("ktm_submit_completed");
    const loanCreated = count("loan_create_completed");
    const lenderFundingCompleted = count("lender_funding_completed");

    const toRate = (num: number, den: number) => (den === 0 ? 0 : Math.round((num / den) * 100));

    return {
      totalEvents: events.length,
      counts: {
        auth_register_started: registerStarted,
        auth_register_completed: registerCompleted,
        auth_siws_nonce_requested: count("auth_siws_nonce_requested"),
        auth_siws_verified: count("auth_siws_verified"),
        ktm_submit_started: count("ktm_submit_started"),
        ktm_submit_completed: ktmCompleted,
        loan_create_started: count("loan_create_started"),
        loan_create_completed: loanCreated,
        lender_marketplace_view: count("lender_marketplace_view"),
        lender_funding_clicked: count("lender_funding_clicked"),
        lender_funding_completed: lenderFundingCompleted,
        loan_repaid_on_time: count("loan_repaid_on_time"),
      },
      conversion: {
        registerCompletionRate: toRate(registerCompleted, registerStarted),
        ktmCompletionFromRegisterRate: toRate(ktmCompleted, registerCompleted),
        loanCreationFromKtmRate: toRate(loanCreated, ktmCompleted),
        fundingCompletionFromLoanRate: toRate(lenderFundingCompleted, loanCreated),
      },
    };
  },
};
