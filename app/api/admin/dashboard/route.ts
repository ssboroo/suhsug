import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const campaign = await db.campaign.findFirst({ where: { isActive: true }, select: { id: true, title: true, description: true, heroImageUrl: true, targetTicketCount: true, bankName: true, accountHolder: true, accountNumber: true, iban: true, facebookPageUrl: true, heroEyebrow: true, heroOverline: true, faqContent: true, stepsContent: true, closingTitle: true, footerDescription: true, status: true } });
  if (!campaign) return NextResponse.json({ participants: 0, tickets: 0, transactionCount: 0, campaign: null, imports: [] });
  const [participantRows, tickets, transactionCount, imports, duplicateRows] = await Promise.all([
    db.$queryRaw<Array<{ count: number }>>`SELECT COUNT(DISTINCT "phoneNumber")::int AS count FROM "LotteryTransaction" WHERE "campaignId" = ${campaign.id}`,
    db.lotteryTransaction.count({ where: { campaignId: campaign.id } }),
    db.lotteryTransaction.count({ where: { campaignId: campaign.id } }),
    db.importBatch.findMany({ where: { campaignId: campaign.id }, orderBy: { createdAt: "desc" }, take: 20,
      select: { id: true, fileName: true, fileHash: true, sheetName: true, mode: true, status: true, totalRows: true, importedRows: true, rejectedRows: true, duplicateRows: true, duplicatePhoneRows: true, createdAt: true } }),
    db.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM (SELECT "phoneNumber" FROM "LotteryTransaction" WHERE "campaignId" = ${campaign.id} GROUP BY "phoneNumber" HAVING COUNT(*) > 1) repeated`
  ]);
  return NextResponse.json({
    participants: Number(participantRows[0]?.count ?? 0),
    tickets,
    transactionCount,
    duplicatePhoneCount: Number(duplicateRows[0]?.count ?? 0),
    campaign,
    imports
  });
}
