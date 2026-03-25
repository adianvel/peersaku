import { NextResponse } from "next/server";
import { z } from "zod";

import { dbService } from "@/lib/server/db-service";
import { mintStudentIdNft } from "@/lib/server/nft-mint";

const updateSchema = z.object({
  verification: z.enum(["pending", "approved", "rejected"]),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Status verifikasi tidak valid",
      },
      { status: 400 },
    );
  }

  const updated = await dbService.updateKtmVerification(id, parsed.data.verification);

  if (!updated) {
    return NextResponse.json(
      {
        ok: false,
        error: "Submission tidak ditemukan",
      },
      { status: 404 },
    );
  }

  // If approved, mint Student ID NFT
  let nftResult = null;
  if (parsed.data.verification === "approved") {
    // Get the user's wallet address
    const user = await dbService.findUserById(updated.userId);

    if (user?.walletAddress) {
      try {
        nftResult = await mintStudentIdNft({
          studentName: user.fullName,
          university: updated.university,
          major: updated.major,
          studentIdNum: updated.studentIdNum,
          enrollmentYear: updated.enrollmentYear,
          ktmImageUrl: updated.ktmImageUrl,
          walletAddress: user.walletAddress,
        });

        // Save NFT mint address to student profile
        await dbService.updateStudentNftMint(id, nftResult.assetId);

        await dbService.appendAuditEvent({
          source: "nft",
          type: "student_id.minted",
          payload: {
            userId: user.id,
            profileId: id,
            assetId: nftResult.assetId,
            signature: nftResult.signature,
          },
        });
      } catch (error) {
        console.error("NFT minting failed:", error);
        // Don't fail the approval — just log the error
        await dbService.appendAuditEvent({
          source: "nft",
          type: "student_id.mint_failed",
          payload: {
            userId: user.id,
            profileId: id,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    data: {
      ...updated,
      nft: nftResult,
    },
    message: nftResult
      ? "Verifikasi disetujui dan Student ID NFT berhasil di-mint!"
      : "Status verifikasi berhasil diperbarui",
  });
}
