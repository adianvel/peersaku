#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo "user=$(whoami)"
command -v avm || true
command -v anchor || true
command -v solana || true
anchor --version || true
solana --version || true
