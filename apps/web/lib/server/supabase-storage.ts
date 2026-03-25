import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase env vars belum di-set. Storage akan gagal.");
}

/** Server-side Supabase client with service role (bypasses RLS) */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const KTM_BUCKET = "ktm-uploads";

/**
 * Upload KTM image to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadKtmImage(
  userId: string,
  file: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  const ext = fileName.split(".").pop() ?? "jpg";
  const storagePath = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(KTM_BUCKET)
    .upload(storagePath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload KTM gagal: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(KTM_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Upload selfie image to Supabase Storage.
 */
export async function uploadSelfieImage(
  userId: string,
  file: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  const ext = fileName.split(".").pop() ?? "jpg";
  const storagePath = `${userId}/selfie_${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(KTM_BUCKET)
    .upload(storagePath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload selfie gagal: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(KTM_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}
