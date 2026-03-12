#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
avm install 0.31.1
avm use 0.31.1
anchor --version
mkdir -p "$HOME/.config/solana"
if [ ! -f "$HOME/.config/solana/id.json" ]; then
  solana-keygen new --no-bip39-passphrase --silent --force -o "$HOME/.config/solana/id.json"
fi
solana config set --keypair "$HOME/.config/solana/id.json" --url localhost
