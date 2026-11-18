import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const { id } = await context.params;
  const batch = await db.importBatch.findUnique({ where: { id }, select: { id: true, fileName: true, errors: { orderBy: { rowNumber: "asc" }, select: { rowNumber: true, message: true, rawData: true } } } });
  if (!batch) return NextResponse.json({ error: "Импорт олдсонгүй." }, { status: 404 });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Алдаатай мөрүүд");
  sheet.columns = [
    { header: "Excel мөр", key: "rowNumber", width: 14 },
    { header: "Алдааны тайлбар", key: "message", width: 52 },
    { header: "Эх өгөгдөл", key: "rawData", width: 90 }
  ];
  for (const error of batch.errors) sheet.addRow({
    rowNumber: error.rowNumber,
    message: error.message,
    rawData: JSON.stringify(error.rawData ?? {})
  });
  sheet.getRow(1).font = { bold: true };
  const bytes = await workbook.xlsx.writeBuffer();
  const safeName = batch.fileName.replace(/[^\w.-]+/g, "_").replace(/\.(xlsx|xls)$/i, "");
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="import-errors-${safeName}.xlsx"`,
      "Cache-Control": "no-store"
    }
  });
}
