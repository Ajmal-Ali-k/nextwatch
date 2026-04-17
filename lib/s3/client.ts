import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_S3_REGION ?? "ap-south-1";
const bucket = process.env.AWS_S3_BUCKET ?? "";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return _client;
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 300 });
}

export function getPublicUrl(key: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export function generateHeroBannerKey(filename: string): string {
  const sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
  return `hero-banners/${Date.now()}-${sanitized}`;
}
