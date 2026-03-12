# @peersaku/contracts

Phase 1 smart contract baseline untuk PeerSaku.

## Program

- `peersaku-lending`
  - `initialize(platform_fee_bps)`
  - `create_loan(...)`
  - `fund_loan(...)`
  - `disburse_loan()`
  - `repay_loan(amount)`
  - `cancel_loan()`
  - `mark_default()`

- `peersaku-credit`
  - `initialize_program()`
  - `initialize_profile(student_nft)`
  - `record_loan_started(loan_amount)`
  - `update_score_on_repay(...)`
  - `update_score_on_late_payment(days_late)`
  - `update_score_on_default()`
  - `update_score_on_default_by_authority()`

## CPI hook (Phase 1)

- `lending.disburse_loan()` memanggil `credit.record_loan_started()`
- `lending.repay_loan()` memanggil `credit.update_score_on_repay()`
- `lending.mark_default()` memanggil `credit.update_score_on_default_by_authority()`

## Urutan inisialisasi

1. `lending.initialize(platform_fee_bps)`
2. `credit.initialize_program()`
3. per borrower: `credit.initialize_profile(student_nft)`
4. lifecycle loan normal (`create -> fund -> disburse -> repay/default`)

## Catatan

- Script `pnpm --filter @peersaku/contracts test:anchor` butuh Anchor CLI terpasang.
- Tes di `tests/phase1.spec.ts` saat ini baseline checklist dan siap diisi dengan call instruction Anchor TS.
