import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const maxDuration = 30;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const types = {
  "image/jpeg": { extension: "jpg", signature: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { extension: "png", signature: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) },
  "image/webp": { extension: "webp", signature: (b: Buffer) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" }
} as const;

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
  if (!region || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    return NextResponse.json({ error: "Зураг хадгалах S3/R2 тохиргоо дутуу байна." }, { status: 503 });
  }
  let publicBase: URL;
  try {
    publicBase = new URL(publicBaseUrl);
    if (publicBase.protocol !== "https:" || publicBase.username || publicBase.password || publicBase.search || publicBase.hash) throw new Error("HTTPS public base URL required");
  } catch {
    return NextResponse.json({ error: "S3_PUBLIC_BASE_URL нь хүчинтэй HTTPS URL байх ёстой." }, { status: 503 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Зураг 4MB-аас бага байх ёстой." }, { status: 400 });
  }
  const mime = file.type as keyof typeof types;
  const rule = types[mime];
  if (!rule) return NextResponse.json({ error: "Зөвхөн JPG, PNG, WebP зураг зөвшөөрнө." }, { status: 400 });

  const body = Buffer.from(await file.arrayBuffer());
  if (!rule.signature(body)) return NextResponse.json({ error: "Зургийн файлын төрөл баталгаажаагүй байна." }, { status: 400 });

  const key = `campaign/${randomUUID()}.${rule.extension}`;
  const client = new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: { accessKeyId, secretAccessKey }
  });
  try {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: mime,
      ContentLength: body.length,
      CacheControl: "public, max-age=31536000, immutable"
    }));
    const base = publicBase.toString().replace(/\/$/, "");
    const url = `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
    await db.adminAuditLog.create({ data: { action: "CAMPAIGN_IMAGE_UPLOAD", details: { key, contentType: mime, size: body.length } } }).catch(() => undefined);
    return NextResponse.json({ ok: true, url });
  } catch {
    return NextResponse.json({ error: "Зургийг хадгалахад алдаа гарлаа. S3/R2 тохиргоогоо шалгана уу." }, { status: 502 });
  } finally {
    client.destroy();
  }
}
