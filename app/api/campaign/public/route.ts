import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const campaign = await db.campaign.findFirst({
      where: { isActive: true, status: "PUBLISHED" },
      select: { id: true, title: true, targetTicketCount: true, description: true, heroImageUrl: true, targetTicketCount: true, bankName: true, bankLogoUrl: true, accountHolder: true, accountNumber: true, iban: true, facebookPageUrl: true, heroEyebrow: true, heroOverline: true, faqContent: true, stepsContent: true, closingTitle: true, footerDescription: true }
    });
    if (!campaign) return NextResponse.json({ campaign: null, progress: null }, { headers: { "Cache-Control": "no-store" } });
    const [totals, participantRows] = await Promise.all([db.lotteryTransaction.aggregate({ where: { campaignId: campaign.id }, _sum: { ticketCount: true } }), db.$queryRaw<Array<{ count: number }>>`SELECT COUNT(DISTINCT "phoneNumber")::int AS count FROM "LotteryTransaction" WHERE "campaignId" = ${campaign.id}`]);
    const tickets = totals._sum.ticketCount ?? 0;
    const target = campaign.targetTicketCount;
    const publicCampaign = { targetTicketCount: campaign.targetTicketCount, title: campaign.title, description: campaign.description, heroImageUrl: campaign.heroImageUrl, bankName: campaign.bankName, bankLogoUrl: campaign.bankLogoUrl, accountHolder: campaign.accountHolder, accountNumber: campaign.accountNumber, iban: campaign.iban, facebookPageUrl: campaign.facebookPageUrl, heroEyebrow: campaign.heroEyebrow, heroOverline: campaign.heroOverline, faqContent: campaign.faqContent, stepsContent: campaign.stepsContent, closingTitle: campaign.closingTitle, footerDescription: campaign.footerDescription };
    return NextResponse.json({ campaign: publicCampaign, stats: { participants: Number(participantRows[0]?.count ?? 0), tickets }, progress: target && target > 0 ? { percent: Math.min(100, Math.round((tickets / target) * 100)), sold: tickets, target, remaining: Math.max(0, target - tickets) } : { percent: 0, sold: tickets, target: null, remaining: null } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Түр алдаа гарлаа." }, { status: 503 });
  }
}
