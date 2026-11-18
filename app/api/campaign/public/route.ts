import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const campaign = await db.campaign.findFirst({
      where: { isActive: true, status: "PUBLISHED" },
      select: { id: true, title: true, description: true, heroImageUrl: true, targetTicketCount: true, bankName: true, accountHolder: true, accountNumber: true, iban: true, facebookPageUrl: true }
    });
    if (!campaign) return NextResponse.json({ campaign: null, progress: null }, { headers: { "Cache-Control": "no-store" } });
    const totals = await db.lotteryTransaction.aggregate({ where: { campaignId: campaign.id }, _sum: { ticketCount: true } });
    const tickets = totals._sum.ticketCount ?? 0;
    const target = campaign.targetTicketCount;
    const publicCampaign = { title: campaign.title, description: campaign.description, heroImageUrl: campaign.heroImageUrl, bankName: campaign.bankName, accountHolder: campaign.accountHolder, accountNumber: campaign.accountNumber, iban: campaign.iban, facebookPageUrl: campaign.facebookPageUrl };
    return NextResponse.json({ campaign: publicCampaign, progress: target && target > 0 ? { percent: Math.min(100, Math.round((tickets / target) * 100)) } : null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Түр алдаа гарлаа." }, { status: 503 });
  }
}
