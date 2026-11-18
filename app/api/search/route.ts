import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, requestIdentity } from "@/lib/rate-limit";

const querySchema = z.string().regex(/^[6-9]\d{7}$/);

export async function GET(request: NextRequest) {
  const phone = (request.nextUrl.searchParams.get("phone") ?? "").trim();
  if (!querySchema.safeParse(phone).success) {
    return NextResponse.json({ error: "Монгол утасны дугаар 8 оронтой байх шаардлагатай." }, { status: 400 });
  }
  try {
    const limit = await checkRateLimit("public-search", requestIdentity(request.headers));
    if (!limit.configured) return NextResponse.json({ error: "Хайлтын хамгаалалт тохируулаагүй байна." }, { status: 503 });
    if (!limit.success) return NextResponse.json(
      { error: "Хэт олон удаа хайлт хийлээ. Түр хүлээгээд дахин оролдоно уу." },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000))) } }
    );
    const campaignId = request.nextUrl.searchParams.get("campaignId");
    const campaign = campaignId ? await db.campaign.findFirst({ where: { id: campaignId, isActive: true, status: "PUBLISHED" }, select: { id: true } }) : await db.campaign.findFirst({ where: { isActive: true, status: "PUBLISHED" }, orderBy: { updatedAt: "desc" }, select: { id: true } });
    if (!campaign) return NextResponse.json({ records: [], ticketCount: 0, occurrenceCount: 0 }, { headers: { "Cache-Control": "no-store, max-age=0" } });

    const [count, latest] = await Promise.all([
      db.lotteryTransaction.count({ where: { campaignId: campaign.id, phoneNumber: phone } }),
      db.lotteryTransaction.findFirst({
        where: { campaignId: campaign.id, phoneNumber: phone },
        orderBy: { transactionDate: "desc" },
        select: { transactionDate: true }
      })
    ]);
    const records = count ? [{ transactionDate: latest?.transactionDate ?? new Date(), phoneNumber: phone, ticketCount: count }] : [];
    return NextResponse.json({ records, ticketCount: count, occurrenceCount: count }, {
      headers: { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" }
    });
  } catch {
    return NextResponse.json({ error: "Системийн мэдээллийн сантай холбогдоход алдаа гарлаа." }, { status: 503 });
  }
}
