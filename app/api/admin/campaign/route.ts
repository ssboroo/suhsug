import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const campaign = await db.campaign.findFirst({ where: { isActive: true }, select: { id: true, title: true, description: true, heroImageUrl: true, targetTicketCount: true, status: true } });
  return NextResponse.json({ campaign });
}

const updateSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().max(600),
  heroImageUrl: z.union([z.literal(""), z.string().url().max(2048)]),
  targetTicketCount: z.number().int().positive().max(100000000).nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"])
});

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Мэдээллээ шалгана уу. Зурагны холбоос HTTPS байх ёстой." }, { status: 400 });
  const { title, description, heroImageUrl, targetTicketCount, status } = parsed.data;
  if (heroImageUrl && new URL(heroImageUrl).protocol !== "https:") return NextResponse.json({ error: "Зургийн холбоос HTTPS байх ёстой." }, { status: 400 });
  const campaign = await db.campaign.findFirst({ where: { isActive: true }, select: { id: true } });
  if (!campaign) return NextResponse.json({ error: "Идэвхтэй сугалаа олдсонгүй." }, { status: 404 });
  const updated = await db.$transaction(async tx => {
    const row = await tx.campaign.update({ where: { id: campaign.id }, data: { title, description, heroImageUrl: heroImageUrl || null, targetTicketCount, status } });
    await tx.adminAuditLog.create({ data: { action: "CAMPAIGN_SETTINGS_UPDATE", details: { campaignId: row.id, title, status, hasHeroImage: Boolean(heroImageUrl) } } });
    return row;
  });
  return NextResponse.json({ ok: true, campaign: { id: updated.id, title: updated.title, description: updated.description, heroImageUrl: updated.heroImageUrl, targetTicketCount: updated.targetTicketCount, status: updated.status } });
}
