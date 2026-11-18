import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const campaign = await db.campaign.findFirst({ where: { isActive: true }, select: { id: true, title: true, description: true, heroImageUrl: true, targetTicketCount: true, bankName: true, accountHolder: true, accountNumber: true, iban: true, facebookPageUrl: true, heroEyebrow: true, heroOverline: true, faqContent: true, stepsContent: true, closingTitle: true, footerDescription: true, status: true } });
  if (!campaign) return NextResponse.json({ participants: 0, tickets: 0, transactionCount: 0, campaign: null, imports: [] });
  const [participants, tickets, transactionCount, imports, duplicatePhones] = await Promise.all([
    db.lotteryTransaction.findMany({ where: { campaignId: campaign.id }, distinct: ["phoneNumber"], select: { phoneNumber: true } }),
    db.lotteryTransaction.count({ where: { campaignId: campaign.id } }),
    db.lotteryTransaction.count({ where: { campaignId: campaign.id } }),
    db.importBatch.findMany({ where: { campaignId: campaign.id }, orderBy: { createdAt: "desc" }, take: 20,
      select: { id: true, fileName: true, fileHash: true, sheetName: true, mode: true, status: true, totalRows: true, importedRows: true, rejectedRows: true, duplicateRows: true, createdAt: true } }),
    db.lotteryTransaction.groupBy({ by: ["phoneNumber"], where: { campaignId: campaign.id }, _count: { _all: true }, having: { phoneNumber: { _count: { gt: 1 } } } })
  ]);
  return NextResponse.json({
    participants: participants.length,
    tickets,
    transactionCount,
    duplicatePhoneCount: duplicatePhones.length,
    campaign,
    imports
  });
}
