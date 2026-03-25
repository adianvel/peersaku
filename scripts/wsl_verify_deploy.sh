#!/usr/bin/env bash
set -uo pipefail
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

cd /mnt/d/solana-startupvillage/packages/contracts

echo "=== Anchor Keys ==="
anchor keys list
echo ""

echo "=== Verify Credit Program on Devnet ==="
CREDIT_ID=$(anchor keys list 2>/dev/null | grep peersaku_credit | awk '{print $2}')
echo "Credit ID: $CREDIT_ID"
solana program show "$CREDIT_ID" --url https://api.devnet.solana.com 2>&1
echo ""

echo "=== Verify Lending Program on Devnet ==="
LENDING_ID=$(anchor keys list 2>/dev/null | grep peersaku_lending | awk '{print $2}')
echo "Lending ID: $LENDING_ID"
solana program show "$LENDING_ID" --url https://api.devnet.solana.com 2>&1
echo ""

echo "=== Balance ==="
solana balance --url https://api.devnet.solana.com 2>&1
