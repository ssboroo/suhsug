import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const maxDuration = 60;
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_ROWS = 50_000;

function normalizePhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 8 ? digits : "";
}
function dateValue(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const d = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(value ?? ""));
  return Number.isNaN(d.getTime()) ? null : d;
}
function parseCsvLine(line: string) {
  const cells: string[] = []; let value = ""; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && quoted && line[i + 1] === '"') { value += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) { cells.push(value.trim()); value = ""; }
    else value += ch;
  }
  cells.push(value.trim()); return cells;
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const campaign = await db.campaign.findFirst({ where: { isActive: true }, select: { id: true } });
  if (!campaign) return NextResponse.json({ imports: [] });
  const imports = await db.importBatch.findMany({ where: { campaignId: campaign.id }, orderBy: { createdAt: "desc" }, take: 50,
    select: { id: true, fileName: true, mode: true, status: true, totalRows: true, importedRows: true, rejectedRows: true, duplicateRows: true, createdAt: true } });
  return NextResponse.json({ imports });
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const mode = String(form.get("mode") ?? "APPEND");
  if (!(file instanceof File) || !/\.(xlsx|csv)$/i.test(file.name)) return NextResponse.json({ error: "Зөвхөн .xlsx эсвэл .csv файл оруулна уу." }, { status: 400 });
  if (file.size === 0 || file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Файлын хэмжээ 1 byte–12MB байх ёстой." }, { status: 400 });
  if (!["APPEND", "REPLACE"].includes(mode)) return NextResponse.json({ error: "Импортын горим буруу байна." }, { status: 400 });
  const campaign = await db.campaign.findFirst({ where: { isActive: true } });
  if (!campaign) return NextResponse.json({ error: "Эхлээд идэвхтэй сугалаа үүсгэнэ үү." }, { status: 400 });

  const workbook = new ExcelJS.Workbook();
  const bytes = Buffer.from(await file.arrayBuffer());
  if (file.name.toLowerCase().endsWith(".csv")) {
    const csv = bytes.toString("utf8").replace(/^\uFEFF/, "");
    const sheet = workbook.addWorksheet("Импорт");
    csv.split(/\r?\n/).filter(line => line.trim()).forEach(line => sheet.addRow(parseCsvLine(line)));
  } else {
    await workbook.xlsx.load(bytes);
  }
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) return NextResponse.json({ error: "Файлд импортлох мөр олдсонгүй." }, { status: 400 });
  if (sheet.rowCount - 1 > MAX_ROWS) return NextResponse.json({ error: "Нэг импортод 50,000-аас их мөр оруулах боломжгүй." }, { status: 400 });

  const headers = (sheet.getRow(1).values as unknown[]).slice(1).map(v => String(v ?? "").trim().toLowerCase());
  const find = (names: string[]) => headers.findIndex(h => names.includes(h));
  const dateIndex = find(["transaction_date","date","огноо","гүйлгээний огноо"]);
  const phoneIndex = find(["phone_number","phone","утас","утасны дугаар"]);
  const countIndex = find(["ticket_count","tickets","сугалааны эрх","эрхийн тоо"]);
  const idIndex = find(["transaction_id","id","гүйлгээний дугаар","гүйлгээний утга"]);
  if ([dateIndex, phoneIndex, countIndex, idIndex].some(i => i < 0)) return NextResponse.json({
    error: "Дараах баганууд заавал шаардлагатай: transaction_id, transaction_date, phone_number, ticket_count."
  }, { status: 400 });

  const valid: { transactionId: string; transactionDate: Date; phoneNumber: string; ticketCount: number }[] = [];
  const errors: { rowNumber: number; message: string }[] = [];
  const seen = new Set<string>();
  let duplicates = 0;
  for (let n = 2; n <= sheet.rowCount; n++) {
    const vals = (sheet.getRow(n).values as unknown[]).slice(1);
    if (vals.every(v => v == null || String(v).trim() === "")) continue;
    const phone = normalizePhone(vals[phoneIndex]);
    const date = dateValue(vals[dateIndex]);
    const count = Number(vals[countIndex]);
    const transactionId = String(vals[idIndex] ?? "").trim().slice(0, 160);
    if (!phone || !date || !Number.isInteger(count) || count < 1 || count > 1_000_000 || !transactionId) {
      errors.push({ rowNumber: n, message: "Гүйлгээний ID, 8 оронтой утас, огноо эсвэл эрхийн тоо буруу." }); continue;
    }
    if (seen.has(transactionId)) { duplicates++; continue; }
    seen.add(transactionId);
    valid.push({ transactionId, transactionDate: date, phoneNumber: phone, ticketCount: count });
  }

  if (valid.length === 0) return NextResponse.json({ error: "Импортлох хүчинтэй мөр алга.", rejected: errors.length }, { status: 400 });
  if (mode === "REPLACE" && errors.length > 0) return NextResponse.json({
    error: "REPLACE горимд алдаатай мөртэй файлыг зөвшөөрөхгүй. Excel-ээ засаж дахин оруулна уу.",
    rejected: errors.length, errors: errors.slice(0, 30)
  }, { status: 400 });

  const previous = mode === "REPLACE" ? await db.lotteryTransaction.findMany({ where: { campaignId: campaign.id }, select: { transactionId: true, transactionDate: true, phoneNumber: true, ticketCount: true } }) : [];
  const existingIds = mode === "APPEND" ? new Set((await db.lotteryTransaction.findMany({
    where: { campaignId: campaign.id, transactionId: { in: valid.map(v => v.transactionId) } }, select: { transactionId: true }
  })).map(v => v.transactionId)) : new Set<string>();
  const fresh = valid.filter(v => !existingIds.has(v.transactionId));
  duplicates += valid.length - fresh.length;
  if (fresh.length === 0) return NextResponse.json({ error: "Шинэ гүйлгээ алга. Бүх мөр өмнө нь импортлогдсон байна.", duplicates }, { status: 409 });

  const batch = await db.$transaction(async tx => {
    const created = await tx.importBatch.create({ data: {
      campaignId: campaign.id, fileName: file.name, mode, status: "COMPLETED",
      totalRows: Math.max(0, sheet.rowCount - 1), importedRows: fresh.length, rejectedRows: errors.length, duplicateRows: duplicates,
      snapshot: mode === "REPLACE" ? previous.map(p => ({ ...p, transactionDate: p.transactionDate.toISOString() })) : undefined
    }});
    if (mode === "REPLACE") await tx.lotteryTransaction.deleteMany({ where: { campaignId: campaign.id } });
    await tx.lotteryTransaction.createMany({
      data: fresh.map(item => ({ ...item, campaignId: campaign.id, importBatchId: created.id })),
      skipDuplicates: true
    });
    if (errors.length) await tx.importError.createMany({ data: errors.map(e => ({ batchId: created.id, ...e })) });
    await tx.adminAuditLog.create({ data: { action: "EXCEL_IMPORT", details: { fileName: file.name, mode, imported: fresh.length, rejected: errors.length } } });
    return created;
  });
  return NextResponse.json({ ok: true, batchId: batch.id, imported: fresh.length, rejected: errors.length, duplicates, errors: errors.slice(0, 30) });
}
