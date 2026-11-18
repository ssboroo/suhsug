import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateFromCell, parsePhoneCell, readWorkbook, rowsForSheet, sha256 } from "@/lib/lottery-import";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_ROWS = 50_000;

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const campaign = campaignId ? await db.campaign.findUnique({ where: { id: campaignId }, select: { id: true } }) : await db.campaign.findFirst({ where: { isActive: true }, select: { id: true } });
  if (!campaign) return NextResponse.json({ imports: [] });
  const imports = await db.importBatch.findMany({
    where: { campaignId: campaign.id }, orderBy: { createdAt: "desc" }, take: 50,
    select: { id: true, fileName: true, fileHash: true, sheetName: true, mode: true, status: true, totalRows: true, importedRows: true, rejectedRows: true, duplicateRows: true, duplicatePhoneRows: true, createdAt: true }
  });
  return NextResponse.json({ imports });
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const mode = String(form.get("mode") ?? "APPEND");
  const sheetName = String(form.get("sheetName") ?? "");
  const headerRow = Number(form.get("headerRow") ?? 1);
  const startRow = Number(form.get("startRow") ?? headerRow + 1);
  const phoneColumn = Number(form.get("phoneColumn") ?? 0);
  const campaignId = String(form.get("campaignId") ?? "");
  if (!(file instanceof File) || !/\.(xlsx|xls)$/i.test(file.name)) return NextResponse.json({ error: "Зөвхөн .xlsx болон .xls файл оруулна уу." }, { status: 400 });
  if (!file.size || file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Файлын хэмжээ 1 byte–12MB байх ёстой." }, { status: 400 });
  if (!["APPEND", "REPLACE"].includes(mode)) return NextResponse.json({ error: "Импортын горим буруу байна." }, { status: 400 });
  if (!sheetName || !Number.isInteger(headerRow) || headerRow < 1 || !Number.isInteger(startRow) || startRow <= headerRow || !Number.isInteger(phoneColumn) || phoneColumn < 1 || phoneColumn > 200) {
    return NextResponse.json({ error: "Sheet, толгой мөр, өгөгдлийн эхлэх мөр болон утасны баганаа зөв сонгоно уу." }, { status: 400 });
  }
  const campaign = await db.campaign.findFirst({ where: { isActive: true }, select: { id: true } });
  if (!campaign) return NextResponse.json({ error: "Эхлээд идэвхтэй сугалаа үүсгэнэ үү." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileHash = sha256(buffer);
  let rows: unknown[][];
  try {
    const workbook = readWorkbook(buffer);
    rows = rowsForSheet(workbook, sheetName);
  } catch {
    return NextResponse.json({ error: "Сонгосон sheet-ийг уншиж чадсангүй." }, { status: 400 });
  }
  if (rows.length < startRow) return NextResponse.json({ error: "Өгөгдлийн эхлэх мөрөөс хойш мэдээлэл алга." }, { status: 400 });
  if (rows.length - startRow + 1 > MAX_ROWS) return NextResponse.json({ error: "Нэг sheet-д 50,000-аас их мөр оруулах боломжгүй." }, { status: 400 });

  const headerValues = rows[headerRow - 1] ?? [];
  const dateColumn = headerValues.findIndex(value => /date|огноо/i.test(String(value ?? ""))) + 1;
  const valid: { transactionId: string; transactionDate: Date; phoneNumber: string; ticketCount: 1; sourceFileHash: string; sourceSheet: string; sourceRow: number }[] = [];
  const errors: { rowNumber: number; message: string; rawData: { values: string[] } }[] = [];
  let totalRows = 0;
  let duplicatePhoneRows = 0;
  const seenPhones = new Set<string>();

  for (let index = startRow - 1; index < rows.length; index++) {
    const row = rows[index] ?? [];
    if (row.every(value => value === null || value === undefined || String(value).trim() === "")) continue;
    totalRows++;
    const parsed = parsePhoneCell(row[phoneColumn - 1]);
    if (!parsed.phone) {
      const message = parsed.reason === "EMPTY" ? "Утасны дугаар хоосон." : parsed.reason === "MULTIPLE" ? "Нэг нүдэнд олон утасны дугаар байна. Гараар шалгана уу." : "8 оронтой хүчинтэй утасны дугаар биш.";
      errors.push({ rowNumber: index + 1, message, rawData: { values: row.map(value => String(value ?? "").slice(0, 500)) } });
      continue;
    }
    if (seenPhones.has(parsed.phone)) duplicatePhoneRows++;
    seenPhones.add(parsed.phone);
    const transactionId = "row_" + createHash("sha256").update(`${fileHash}:${sheetName}:${index + 1}`).digest("hex");
    valid.push({
      transactionId,
      transactionDate: dateColumn > 0 ? dateFromCell(row[dateColumn - 1]) : new Date(),
      phoneNumber: parsed.phone,
      ticketCount: 1,
      sourceFileHash: fileHash,
      sourceSheet: sheetName,
      sourceRow: index + 1
    });
  }

  if (!totalRows) return NextResponse.json({ error: "Сонгосон мужид өгөгдөл алга." }, { status: 400 });
  if (!valid.length && mode === "REPLACE") return NextResponse.json({ error: "REPLACE хийхэд хүчинтэй утасны дугаар алга. Өмнөх өгөгдлийг хамгаалж өөрчлөлт хийгээгүй.", totalRows, rejected: errors.length, errors: errors.slice(0, 100) }, { status: 400 });

  try {
    const result = await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Campaign" WHERE "id" = ${campaign.id} FOR UPDATE`;
      const previousBatch = await tx.importBatch.findFirst({
        where: { campaignId: campaign.id, fileHash, sheetName, status: { not: "ROLLED_BACK" } },
        select: { id: true }
      });
      if (previousBatch) throw new Error("FILE_ALREADY_IMPORTED");

      const previous = mode === "REPLACE" ? await tx.lotteryTransaction.findMany({
        where: { campaignId: campaign.id },
        select: { transactionId: true, transactionDate: true, phoneNumber: true, ticketCount: true, sourceFileHash: true, sourceSheet: true, sourceRow: true, importBatchId: true }
      }) : [];
      const batch = await tx.importBatch.create({ data: {
        campaignId: campaign.id, fileName: file.name, fileHash, sheetName, mode, status: "COMPLETED",
        totalRows, importedRows: valid.length, rejectedRows: errors.length, duplicateRows: 0, duplicatePhoneRows,
        snapshot: mode === "REPLACE" ? previous.map(row => ({ ...row, transactionDate: row.transactionDate.toISOString() })) : undefined
      }});
      if (mode === "REPLACE") await tx.lotteryTransaction.deleteMany({ where: { campaignId: campaign.id } });
      if (valid.length) await tx.lotteryTransaction.createMany({
        data: valid.map(row => ({ ...row, campaignId: campaign.id, importBatchId: batch.id })),
        skipDuplicates: false
      });
      if (errors.length) await tx.importError.createMany({ data: errors.map(error => ({ batchId: batch.id, ...error })) });
      await tx.adminAuditLog.create({ data: {
        action: "EXCEL_IMPORT",
        details: { batchId: batch.id, fileName: file.name, fileHash, sheetName, mode, totalRows, imported: valid.length, rejected: errors.length, duplicatePhoneRows }
      }});
      const [ticketTotal, participantTotal] = await Promise.all([
        tx.lotteryTransaction.count({ where: { campaignId: campaign.id } }),
        tx.lotteryTransaction.findMany({ where: { campaignId: campaign.id }, distinct: ["phoneNumber"], select: { phoneNumber: true } })
      ]);
      return { batchId: batch.id, tickets: ticketTotal, participants: participantTotal.length };
    }, { isolationLevel: "Serializable", timeout: 60_000 });

    return NextResponse.json({
      ok: true, batchId: result.batchId, mode, totalRows, imported: valid.length, rejected: errors.length,
      duplicatePhoneRows, totalTickets: result.tickets, totalParticipants: result.participants,
      errors: errors.slice(0, 100)
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FILE_ALREADY_IMPORTED") {
      return NextResponse.json({ error: "Энэ Excel файл болон sheet өмнө нь амжилттай импортлогдсон байна. Давхар эрх үүсгэхээс хамгаалж зогсоолоо." }, { status: 409 });
    }
    return NextResponse.json({ error: "Импорт амжилтгүй. Өгөгдлийн сангийн өөрчлөлтийг бүхэлд нь буцаалаа." }, { status: 500 });
  }
}
