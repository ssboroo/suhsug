import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const campaign = await db.campaign.findFirst({ where: { isActive: true }, select: { id: true, title: true, description: true, heroImageUrl: true, targetTicketCount: true, status: true } });
  if (!campaign) return NextResponse.json({ participants: 0, tickets: 0, campaign: null, imports: [] });
  const [participantRows, totals, imports] = await Promise.all([
    db.$queryRaw<Array<{ count: number }>>`SELECT COUNT(DISTINCT "phoneNumber")::int AS count FROM "LotteryTransaction" WHERE "campaignId" = ${campaign.id}`,
    db.lotteryTransaction.aggregate({ where: { campaignId: campaign.id }, _sum: { ticketCount: true }, _count: { _all: true } }),
    db.importBatch.findMany({ where: { campaignId: campaign.id }, orderBy: { createdAt: "desc" }, take: 20,
      select: { id: true, fileName: true, mode: true, status: true, totalRows: true, importedRows: true, rejectedRows: true, duplicateRows: true, createdAt: true } })
  ]);
  return NextResponse.json({ participants: Number(participantRows[0]?.count ?? 0), tickets: totals._sum.ticketCount ?? 0, transactionCount: totals._count._all, campaign, imports });
}
