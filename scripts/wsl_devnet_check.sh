#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo "=== Solana Config ==="
solana config set --url https://api.devnet.solana.com

echo ""
echo "=== Wallet Address ==="
solana address

echo ""
echo "=== Balance ==="
solana balance
