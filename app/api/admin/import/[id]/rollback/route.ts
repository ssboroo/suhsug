import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const maxDuration = 60;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const { id } = await context.params;
  const batch = await db.importBatch.findUnique({ where: { id } });
  if (!batch || batch.status === "ROLLED_BACK") return NextResponse.json({ error: "Импорт олдсонгүй эсвэл өмнө нь сэргээсэн байна." }, { status: 400 });

  try {
    await db.$transaction(async tx => {
      // Use the same campaign lock as imports to make rollback ordering deterministic.
      await tx.$queryRaw`SELECT "id" FROM "Campaign" WHERE "id" = ${batch.campaignId} FOR UPDATE`;
      const latest = await tx.importBatch.findFirst({
        where: { campaignId: batch.campaignId },
        orderBy: { createdAt: "desc" },
        select: { id: true }
      });
      if (latest?.id !== batch.id) throw new Error("IMPORT_NOT_LATEST");
      const current = await tx.importBatch.findUnique({ where: { id } });
      if (!current || current.status === "ROLLED_BACK") throw new Error("IMPORT_ALREADY_ROLLED_BACK");

      if (current.mode === "REPLACE") {
        if (!Array.isArray(current.snapshot)) throw new Error("SNAPSHOT_MISSING");
        await tx.lotteryTransaction.deleteMany({ where: { campaignId: current.campaignId } });
        const snapshot = current.snapshot as { transactionId: string; transactionDate: string; phoneNumber: string; ticketCount: number }[];
        if (snapshot.length) await tx.lotteryTransaction.createMany({ data: snapshot.map(row => ({
          campaignId: current.campaignId, transactionId: row.transactionId, transactionDate: new Date(row.transactionDate), phoneNumber: row.phoneNumber, ticketCount: row.ticketCount
        })) });
      } else {
        await tx.lotteryTransaction.deleteMany({ where: { importBatchId: current.id } });
      }
      await tx.adminAuditLog.create({ data: { action: "IMPORT_ROLLBACK", details: { batchId: id, fileName: current.fileName, mode: current.mode } } });
      await tx.importBatch.update({ where: { id }, data: { status: "ROLLED_BACK" } });
    }, { isolationLevel: "Serializable", timeout: 45_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "IMPORT_NOT_LATEST") return NextResponse.json({ error: "Зөвхөн хамгийн сүүлийн Excel импортыг буцаах боломжтой." }, { status: 409 });
    if (message === "IMPORT_ALREADY_ROLLED_BACK") return NextResponse.json({ error: "Энэ импорт өмнө нь сэргээгдсэн байна." }, { status: 409 });
    if (message === "SNAPSHOT_MISSING") return NextResponse.json({ error: "Нөөц хуулбар байхгүй тул сэргээх боломжгүй." }, { status: 409 });
    throw error;
  }
  return NextResponse.json({ ok: true });
}
