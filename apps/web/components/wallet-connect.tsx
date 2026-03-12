"use client";

import { useMemo } from "react";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletConnect() {
  const { publicKey } = useWallet();

  const shortAddress = useMemo(() => {
    if (!publicKey) {
      return "Belum terhubung";
    }

    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [publicKey]);

  return (
    <div className="flex flex-col items-end gap-2">
      <WalletMultiButton className="!h-10 !rounded-none !border !border-white/10 !bg-[var(--cobalt)] !px-4 !font-mono !text-xs !font-semibold !tracking-[0.15em] !text-white hover:!bg-[var(--cobalt-hover)]" />
      <p className="font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
        {shortAddress}
      </p>
    </div>
  );
}
