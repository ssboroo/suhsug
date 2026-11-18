import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const { id } = await context.params;
  const batch = await db.importBatch.findUnique({ where: { id } });
  if (!batch || batch.status === "ROLLED_BACK") return NextResponse.json({ error: "Импорт олдсонгүй эсвэл өмнө нь сэргээсэн байна." }, { status: 400 });
  await db.$transaction(async tx => {
    if (batch.mode === "REPLACE") {
      if (!Array.isArray(batch.snapshot)) throw new Error("Нөөц хуулбар байхгүй байна.");
      await tx.lotteryTransaction.deleteMany({ where: { campaignId: batch.campaignId } });
      const snapshot = batch.snapshot as { transactionId: string; transactionDate: string; phoneNumber: string; ticketCount: number }[];
      if (snapshot.length) await tx.lotteryTransaction.createMany({ data: snapshot.map(row => ({
        campaignId: batch.campaignId, transactionId: row.transactionId, transactionDate: new Date(row.transactionDate), phoneNumber: row.phoneNumber, ticketCount: row.ticketCount
      })) });
    } else {
      await tx.lotteryTransaction.deleteMany({ where: { importBatchId: batch.id } });
    }
    await tx.adminAuditLog.create({ data: { action: "IMPORT_ROLLBACK", details: { batchId: id, fileName: batch.fileName, mode: batch.mode } } });
    await tx.importBatch.update({ where: { id }, data: { status: "ROLLED_BACK" } });
  });
  return NextResponse.json({ ok: true });
}