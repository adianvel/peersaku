import { NextResponse } from "next/server";

import { createMerkleTree, createCollectionNft } from "@/lib/server/nft-mint";

/**
 * POST /api/admin/nft-setup
 * One-time setup: creates Merkle Tree + Collection NFT on devnet.
 * Returns the addresses to be set in .env
 */
export async function POST() {
  try {
    const merkleTreeAddress = await createMerkleTree();
    const collectionMintAddress = await createCollectionNft();

    return NextResponse.json({
      ok: true,
      data: {
        merkleTreeAddress,
        collectionMintAddress,
      },
      message: "NFT setup berhasil! Tambahkan address di bawah ke .env",
      env: {
        MERKLE_TREE_ADDRESS: merkleTreeAddress,
        COLLECTION_MINT_ADDRESS: collectionMintAddress,
      },
    });
  } catch (error) {
    console.error("NFT setup failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "NFT setup failed",
      },
      { status: 500 },
    );
  }
}
