#!/usr/bin/env bash
set -uo pipefail
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

CONTRACTS_DIR="/mnt/d/solana-startupvillage/packages/contracts"
cd "$CONTRACTS_DIR"

echo "=== Solana config info ==="
solana config get 2>&1
echo ""

WALLET=$(solana config get keypair 2>&1 | grep "Keypair Path" | awk '{print $3}')
echo "Using wallet: $WALLET"
echo ""

echo "=== Try deploy credit program with solana CLI directly ==="
solana program deploy \
  --url https://api.devnet.solana.com \
  --keypair "$WALLET" \
  --program-id target/deploy/peersaku_credit-keypair.json \
  target/deploy/peersaku_credit.so \
  2>&1
echo "Credit exit: $?"
echo ""

echo "=== Try deploy lending program ==="
solana program deploy \
  --url https://api.devnet.solana.com \
  --keypair "$WALLET" \
  --program-id target/deploy/peersaku_lending-keypair.json \
  target/deploy/peersaku_lending.so \
  2>&1
echo "Lending exit: $?"
echo ""

echo "=== Final ==="
solana balance --url https://api.devnet.solana.com 2>&1
anchor keys list 2>&1
