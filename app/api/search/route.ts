import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, requestIdentity } from "@/lib/rate-limit";

const querySchema = z.string().regex(/^\d{8}$/);

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone") ?? "";
  if (!querySchema.safeParse(phone).success) {
    return NextResponse.json({ error: "Утасны дугаар 8 оронтой байх шаардлагатай." }, { status: 400 });
  }
  try {
    const limit = await checkRateLimit("public-search", requestIdentity(request.headers));
    if (!limit.configured) return NextResponse.json({ error: "Хайлтын хамгаалалт тохируулаагүй байна." }, { status: 503 });
    if (!limit.success) return NextResponse.json(
      { error: "Хэт олон удаа хайлт хийлээ. Түр хүлээгээд дахин оролдоно уу." },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000))) } }
    );

    const campaign = await db.campaign.findFirst({ where: { isActive: true, status: "PUBLISHED" }, select: { id: true } });
    if (!campaign) return NextResponse.json({ records: [] }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    const records = await db.lotteryTransaction.findMany({
      where: { campaignId: campaign.id, phoneNumber: phone },
      orderBy: { transactionDate: "desc" },
      take: 100,
      select: { transactionDate: true, phoneNumber: true, ticketCount: true }
    });
    return NextResponse.json({ records }, { headers: { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Системийн мэдээллийн сантай холбогдоход алдаа гарлаа." }, { status: 503 });
  }
}
