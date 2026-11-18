import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { inspectWorkbook, readWorkbook, sha256 } from "@/lib/lottery-import";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !/\.(xlsx|xls)$/i.test(file.name)) {
    return NextResponse.json({ error: "Зөвхөн .xlsx болон .xls файл оруулна уу." }, { status: 400 });
  }
  if (!file.size || file.size > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "Файлын хэмжээ 1 byte–12MB байх ёстой." }, { status: 400 });
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = readWorkbook(buffer);
    return NextResponse.json({
      fileName: file.name,
      fileHash: sha256(buffer),
      sheets: inspectWorkbook(workbook)
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Excel файлыг уншиж чадсангүй. Файл эвдэрсэн эсвэл хамгаалалттай байж болно." }, { status: 400 });
  }
}
