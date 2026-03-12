export type UserRole = "borrower" | "lender" | "admin";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type LoanStatus =
  | "pending"
  | "funded"
  | "active"
  | "repaid"
  | "defaulted"
  | "cancelled";

export interface CreditProfileSnapshot {
  score: number;
  totalLoans: number;
  loansRepaid: number;
  loansDefaulted: number;
  onTimePayments: number;
  latePayments: number;
}

export interface LoanListing {
  id: string;
  borrowerName: string;
  university: string;
  amountIdr: number;
  interestApr: number;
  tenorDays: number;
  purposeCategory: string;
  creditScore: number;
  status: LoanStatus;
}
