import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { inspectWorkbook, parsePhoneCell, readWorkbook, rowsForSheet, sha256 } from "@/lib/lottery-import";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !/\.(xlsx|xls)$/i.test(file.name)) return NextResponse.json({ error: "Зөвхөн .xlsx болон .xls файл оруулна уу." }, { status: 400 });
  if (!file.size || file.size > 12 * 1024 * 1024) return NextResponse.json({ error: "Файлын хэмжээ 1 byte–12MB байх ёстой." }, { status: 400 });
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = readWorkbook(buffer);
    const sheets = inspectWorkbook(workbook);
    const sheetName = String(form.get("sheetName") ?? sheets[0]?.name ?? "");
    const headerRow = Number(form.get("headerRow") ?? 1);
    const startRow = Number(form.get("startRow") ?? headerRow + 1);
    const phoneColumn = Number(form.get("phoneColumn") ?? sheets.find(sheet => sheet.name === sheetName)?.suggestedPhoneColumn ?? 1);
    const rows = rowsForSheet(workbook, sheetName);
    if (!Number.isInteger(headerRow) || headerRow < 1 || !Number.isInteger(startRow) || startRow <= headerRow || !Number.isInteger(phoneColumn) || phoneColumn < 1 || phoneColumn > 200) {
      return NextResponse.json({ error: "Толгой мөр, өгөгдлийн эхлэх мөр, утасны баганаа шалгана уу.", sheets }, { status: 400 });
    }
    let totalRows = 0, validRows = 0, invalidRows = 0, duplicatePhoneRows = 0;
    const counts = new Map<string, number>();
    const invalidSamples: { row: number; value: string; reason: string }[] = [];
    for (let index = startRow - 1; index < rows.length; index++) {
      const row = rows[index] ?? [];
      if (row.every(value => value === null || value === undefined || String(value).trim() === "")) continue;
      totalRows++;
      const parsed = parsePhoneCell(row[phoneColumn - 1]);
      if (!parsed.phone) {
        invalidRows++;
        if (invalidSamples.length < 30) invalidSamples.push({ row: index + 1, value: String(row[phoneColumn - 1] ?? ""), reason: parsed.reason });
        continue;
      }
      validRows++;
      const count = counts.get(parsed.phone) ?? 0;
      if (count > 0) duplicatePhoneRows++;
      counts.set(parsed.phone, count + 1);
    }
    return NextResponse.json({
      fileName: file.name, fileHash: sha256(buffer), sheets,
      selected: { sheetName, headerRow, startRow, phoneColumn },
      analysis: { totalRows, validRows, invalidRows, uniquePhones: counts.size, duplicatePhoneRows, totalTickets: validRows, invalidSamples }
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Excel файлыг уншиж чадсангүй. Файл эвдэрсэн эсвэл хамгаалалттай байж болно." }, { status: 400 });
  }
}
