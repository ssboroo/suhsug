import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const campaign = await db.campaign.findFirst({
      where: { isActive: true, status: "PUBLISHED" },
      select: { title: true, description: true, heroImageUrl: true }
    });
    return NextResponse.json({ campaign }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Түр алдаа гарлаа." }, { status: 503 });
  }
}
