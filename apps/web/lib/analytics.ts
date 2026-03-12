export type AnalyticsEventName =
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

export async function trackEvent(input: {
  name: AnalyticsEventName;
  actor?: "borrower" | "lender" | "admin";
  meta?: Record<string, unknown>;
}) {
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    // intentionally ignore analytics transport errors
  }
}
