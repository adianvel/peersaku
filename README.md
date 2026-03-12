# PeerSaku

Monorepo awal untuk platform P2P micro-lending berbasis Solana.

## Workspace

- `apps/web` — frontend Next.js 15
- `packages/database` — schema Drizzle + util database
- `packages/contracts` — Anchor workspace untuk program Solana
- `packages/shared` — shared types dan constants
- `packages/config` — shared TypeScript config

## Menjalankan proyek

1. Install dependency: `pnpm install`
2. Jalankan web app: `pnpm dev`
3. Jalankan typecheck: `pnpm typecheck`

## Status

- ✅ Phase 0 foundation selesai (monorepo + web scaffold + package structure)
- ✅ Phase 1 smart contract core selesai dan lulus test `anchor test` di WSL
- ✅ Phase 2 backend integration scaffold selesai (auth API, KTM submission API, loan API, webhook Helius, quote Xendit mock)
- ✅ Phase 3 frontend flow selesai (`/auth`, `/borrower`, `/lender`, `/admin`) dengan wallet connect + PWA scaffold
- ✅ Phase 4 testing & launch prep selesai (API smoke tests, CI test gate, audit/security/deploy/soft-launch runbook)
- 🚧 Phase 5 growth berjalan (Week 1 instrumentation + baseline metrics selesai)
