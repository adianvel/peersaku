import { NextResponse } from "next/server";

import { dbService } from "@/lib/server/db-service";
import { uploadKtmImage, uploadSelfieImage } from "@/lib/server/supabase-storage";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json(
      { ok: false, error: "Request harus berupa multipart/form-data" },
      { status: 400 },
    );
  }

  const userId = formData.get("userId") as string | null;
  const university = formData.get("university") as string | null;
  const major = formData.get("major") as string | null;
  const studentIdNum = formData.get("studentIdNum") as string | null;
  const enrollmentYear = formData.get("enrollmentYear") as string | null;
  const ktmFile = formData.get("ktmImage") as File | null;
  const selfieFile = formData.get("selfieImage") as File | null;

  // Validate required fields
  if (!userId || !university || !major || !studentIdNum || !enrollmentYear) {
    return NextResponse.json(
      { ok: false, error: "Semua field wajib diisi: userId, university, major, studentIdNum, enrollmentYear" },
      { status: 400 },
    );
  }

  if (!ktmFile) {
    return NextResponse.json(
      { ok: false, error: "Foto KTM (ktmImage) wajib diupload" },
      { status: 400 },
    );
  }

  // Validate user exists
  const user = await dbService.findUserById(userId);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "User tidak ditemukan" },
      { status: 404 },
    );
  }

  // Upload KTM image
  const ktmBuffer = Buffer.from(await ktmFile.arrayBuffer());
  const ktmImageUrl = await uploadKtmImage(
    userId,
    ktmBuffer,
    ktmFile.name,
    ktmFile.type || "image/jpeg",
  );

  // Upload selfie if provided
  let selfieUrl = "not-provided";
  if (selfieFile) {
    const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());
    selfieUrl = await uploadSelfieImage(
      userId,
      selfieBuffer,
      selfieFile.name,
      selfieFile.type || "image/jpeg",
    );
  }

  // Save to database
  const submission = await dbService.createKtmSubmission({
    userId,
    university,
    major,
    studentIdNum,
    enrollmentYear: parseInt(enrollmentYear, 10),
    ktmImageUrl,
    selfieUrl,
  });

  return NextResponse.json(
    {
      ok: true,
      data: submission,
      message: "KTM submission diterima. Menunggu review admin.",
    },
    { status: 201 },
  );
}
