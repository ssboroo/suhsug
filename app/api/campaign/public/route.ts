import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const campaigns = await db.campaign.findMany({
      where: { isActive: true, status: "PUBLISHED" }, orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, description: true, heroImageUrl: true, targetTicketCount: true, bankName: true, bankLogoUrl: true, accountHolder: true, accountNumber: true, iban: true, facebookPageUrl: true, heroEyebrow: true, heroOverline: true, faqContent: true, stepsContent: true, closingTitle: true, footerDescription: true }
    });
    if (!campaigns.length) return NextResponse.json({ campaigns: [], campaign: null, progress: null }, { headers: { "Cache-Control": "no-store" } });
    const publicCampaigns = await Promise.all(campaigns.map(async campaign => {
      const [totals, participantRows] = await Promise.all([
        db.lotteryTransaction.aggregate({ where: { campaignId: campaign.id }, _sum: { ticketCount: true } }),
        db.$queryRaw<Array<{ count: number }>>`SELECT COUNT(DISTINCT "phoneNumber")::int AS count FROM "LotteryTransaction" WHERE "campaignId" = ${campaign.id}`
      ]);
      const tickets = totals._sum.ticketCount ?? 0; const target = campaign.targetTicketCount;
      return { campaign, stats: { participants: Number(participantRows[0]?.count ?? 0), tickets }, progress: target && target > 0 ? { percent: Math.min(100, Math.round((tickets / target) * 100)), sold: tickets, target, remaining: Math.max(0, target - tickets) } : { percent: 0, sold: tickets, target: null, remaining: null } };
    }));
    return NextResponse.json({ campaigns: publicCampaigns, campaign: publicCampaigns[0].campaign, stats: publicCampaigns[0].stats, progress: publicCampaigns[0].progress }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Түр алдаа гарлаа." }, { status: 503 });
  }
}
