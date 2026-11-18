import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const querySchema = z.string().regex(/^\d{8}$/);

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone") ?? "";
  if (!querySchema.safeParse(phone).success) {
    return NextResponse.json({ error: "Утасны дугаар 8 оронтой байх шаардлагатай." }, { status: 400 });
  }
  try {
    const campaign = await db.campaign.findFirst({ where: { isActive: true, status: "PUBLISHED" }, select: { id: true } });
    if (!campaign) return NextResponse.json({ records: [] });
    const records = await db.lotteryTransaction.findMany({
      where: { campaignId: campaign.id, phoneNumber: phone },
      orderBy: { transactionDate: "desc" },
      select: { transactionDate: true, phoneNumber: true, ticketCount: true }
    });
    return NextResponse.json({ records }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "Системийн мэдээллийн сантай холбогдоход алдаа гарлаа." }, { status: 503 });
  }
}