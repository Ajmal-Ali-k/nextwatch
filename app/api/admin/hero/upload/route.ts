import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getPresignedUploadUrl,
  getPublicUrl,
  generateHeroBannerKey,
} from "@/lib/s3/client";

export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  let body: { filename?: string; contentType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { filename, contentType } = body;
  if (!filename || typeof filename !== "string") {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }
  if (!contentType || !contentType.startsWith("image/")) {
    return NextResponse.json(
      { error: "contentType must be an image type" },
      { status: 400 }
    );
  }

  if (!process.env.AWS_S3_BUCKET) {
    return NextResponse.json(
      { error: "S3 bucket not configured" },
      { status: 500 }
    );
  }

  const s3Key = generateHeroBannerKey(filename);
  const uploadUrl = await getPresignedUploadUrl(s3Key, contentType);
  const publicUrl = getPublicUrl(s3Key);

  return NextResponse.json({ uploadUrl, publicUrl, s3Key });
}
