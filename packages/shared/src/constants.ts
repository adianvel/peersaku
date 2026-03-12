export const APP_NAME = "PeerSaku";
export const SOLANA_NETWORK = "devnet";

export const CREDIT_SCORE_TIERS = {
  blocked: { min: 0, max: 299, maxLoanIdr: 0, interestApr: 0 },
  starter: { min: 300, max: 499, maxLoanIdr: 2_000_000, interestApr: 20 },
  bronze: { min: 500, max: 649, maxLoanIdr: 4_000_000, interestApr: 15 },
  silver: { min: 650, max: 799, maxLoanIdr: 7_000_000, interestApr: 12 },
  gold: { min: 800, max: 1000, maxLoanIdr: 10_000_000, interestApr: 10 },
} as const;

export const LOAN_PURPOSE_OPTIONS = ["UKT", "Laptop", "Kost", "Darurat"] as const;
export const LOAN_TENOR_OPTIONS = [30, 90, 180] as const;
