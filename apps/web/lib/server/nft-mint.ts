import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createTree,
  mintToCollectionV1,
  mplBubblegum,
} from "@metaplex-foundation/mpl-bubblegum";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
  type Umi,
} from "@metaplex-foundation/umi";

// ===== Umi Instance (singleton) =====

let _umi: Umi | null = null;

function getUmi(): Umi {
  if (_umi) return _umi;

  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  _umi = createUmi(rpcUrl)
    .use(mplBubblegum())
    .use(mplTokenMetadata());

  return _umi;
}

/**
 * Load a keypair from a JSON file (Solana CLI format: array of bytes).
 * Used for the NFT authority that signs minting transactions.
 */
export function loadKeypairFromEnv(): import("@metaplex-foundation/umi").Keypair {
  const fs = require("fs");
  const keypairPath = process.env.NFT_AUTHORITY_KEYPAIR_PATH;
  if (!keypairPath) throw new Error("NFT_AUTHORITY_KEYPAIR_PATH not set");

  const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, "utf-8")));
  const umi = getUmi();
  return umi.eddsa.createKeypairFromSecretKey(secretKey);
}

// ===== Setup Functions (run once on devnet) =====

/**
 * Create a Merkle Tree for compressed NFTs.
 * maxDepth=14, maxBufferSize=64 → supports ~16,384 cNFTs.
 * Returns the tree address.
 */
export async function createMerkleTree(): Promise<string> {
  const umi = getUmi();
  const authority = loadKeypairFromEnv();
  umi.use(keypairIdentity(authority));

  const merkleTree = generateSigner(umi);

  const builder = await createTree(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
  });

  await builder.sendAndConfirm(umi);

  console.log("Merkle Tree created:", merkleTree.publicKey.toString());
  return merkleTree.publicKey.toString();
}

/**
 * Create a Collection NFT for PeerSaku Student IDs.
 * Returns the collection mint address.
 */
export async function createCollectionNft(): Promise<string> {
  const umi = getUmi();
  const authority = loadKeypairFromEnv();
  umi.use(keypairIdentity(authority));

  const collectionMint = generateSigner(umi);

  await createNft(umi, {
    mint: collectionMint,
    name: "PeerSaku Student ID",
    symbol: "PSID",
    uri: "https://arweave.net/peersaku-student-id-collection",
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true,
  }).sendAndConfirm(umi);

  console.log("Collection NFT created:", collectionMint.publicKey.toString());
  return collectionMint.publicKey.toString();
}

// ===== Mint Function =====

export interface StudentIdMetadata {
  studentName: string;
  university: string;
  major: string;
  studentIdNum: string;
  enrollmentYear: number;
  ktmImageUrl: string;
  walletAddress: string;
}

/**
 * Mint a compressed NFT (Student ID) to a student's wallet.
 * Returns the asset ID (leaf index as string).
 */
export async function mintStudentIdNft(
  metadata: StudentIdMetadata,
): Promise<{ assetId: string; signature: string }> {
  const umi = getUmi();
  const authority = loadKeypairFromEnv();
  umi.use(keypairIdentity(authority));

  const merkleTreeAddress = process.env.MERKLE_TREE_ADDRESS;
  const collectionMintAddress = process.env.COLLECTION_MINT_ADDRESS;

  if (!merkleTreeAddress) throw new Error("MERKLE_TREE_ADDRESS not set");
  if (!collectionMintAddress) throw new Error("COLLECTION_MINT_ADDRESS not set");

  // Build on-chain metadata URI (using JSON hosted in Supabase or inline)
  const metadataJson = {
    name: `PeerSaku Student ID - ${metadata.studentName}`,
    symbol: "PSID",
    description: `Student ID Card for ${metadata.studentName} at ${metadata.university}`,
    image: metadata.ktmImageUrl,
    external_url: "https://peersaku.com",
    attributes: [
      { trait_type: "University", value: metadata.university },
      { trait_type: "Major", value: metadata.major },
      { trait_type: "Student ID", value: metadata.studentIdNum },
      { trait_type: "Enrollment Year", value: metadata.enrollmentYear.toString() },
      { trait_type: "Status", value: "ACTIVE" },
    ],
  };

  // For devnet, we use a data URI. In production, upload to Arweave/IPFS.
  const metadataUri = `data:application/json;base64,${Buffer.from(JSON.stringify(metadataJson)).toString("base64")}`;

  const leafOwner = publicKey(metadata.walletAddress);

  const result = await mintToCollectionV1(umi, {
    leafOwner,
    merkleTree: publicKey(merkleTreeAddress),
    collectionMint: publicKey(collectionMintAddress),
    metadata: {
      name: `PSID - ${metadata.studentName}`,
      symbol: "PSID",
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      collection: { key: publicKey(collectionMintAddress), verified: false },
      creators: [
        {
          address: authority.publicKey,
          verified: false,
          share: 100,
        },
      ],
    },
  }).sendAndConfirm(umi);

  const signature = Buffer.from(result.signature).toString("base64");

  return {
    assetId: signature,
    signature,
  };
}
