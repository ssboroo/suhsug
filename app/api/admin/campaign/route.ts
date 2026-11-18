import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const campaignId = request.nextUrl.searchParams.get("campaignId");
  const campaign = await db.campaign.findFirst({ where: campaignId ? { id: campaignId } : { isActive: true }, select: { id: true, title: true, description: true, heroImageUrl: true, targetTicketCount: true, bankName: true, bankLogoUrl: true, accountHolder: true, accountNumber: true, iban: true, facebookPageUrl: true, heroEyebrow: true, heroOverline: true, faqContent: true, stepsContent: true, closingTitle: true, footerDescription: true, status: true } });
  return NextResponse.json({ campaign });
}

const updateSchema = z.object({
  campaignId: z.string().min(1),
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().max(600),
  heroImageUrl: z.union([z.literal(""), z.string().url().max(2048)]),
  targetTicketCount: z.number().int().positive().max(100000000).nullable(),
  bankName: z.string().trim().max(80).nullable(),
  bankLogoUrl: z.union([z.literal(""), z.string().url().max(2048)]),
  accountHolder: z.string().trim().max(120).nullable(),
  accountNumber: z.string().trim().max(40).nullable(),
  iban: z.string().trim().max(40).nullable(),
  facebookPageUrl: z.union([z.literal(""), z.string().url().max(2048)]),
  heroEyebrow: z.string().trim().max(100),
  heroOverline: z.string().trim().max(120),
  faqContent: z.string().max(12000),
  stepsContent: z.string().max(3000),
  closingTitle: z.string().trim().max(160),
  footerDescription: z.string().trim().max(240),
  status: z.enum(["DRAFT", "PUBLISHED"])
});

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Мэдээллээ шалгана уу. Зурагны холбоос HTTPS байх ёстой." }, { status: 400 });
  const { campaignId, title, description, heroImageUrl, targetTicketCount, bankName, bankLogoUrl, accountHolder, accountNumber, iban, facebookPageUrl, heroEyebrow, heroOverline, faqContent, stepsContent, closingTitle, footerDescription, status } = parsed.data;
  if (bankLogoUrl && new URL(bankLogoUrl).protocol !== "https:") return NextResponse.json({ error: "Банкны логоны холбоос HTTPS байх ёстой." }, { status: 400 });
  if (facebookPageUrl && new URL(facebookPageUrl).protocol !== "https:") return NextResponse.json({ error: "Facebook Page холбоос HTTPS байх ёстой." }, { status: 400 });
  if (heroImageUrl && new URL(heroImageUrl).protocol !== "https:") return NextResponse.json({ error: "Зургийн холбоос HTTPS байх ёстой." }, { status: 400 });
  const campaign = await db.campaign.findUnique({ where: { id: campaignId }, select: { id: true } });
  if (!campaign) return NextResponse.json({ error: "Идэвхтэй сугалаа олдсонгүй." }, { status: 404 });
  const updated = await db.$transaction(async tx => {
    const row = await tx.campaign.update({ where: { id: campaign.id }, data: { title, description, heroImageUrl: heroImageUrl || null, targetTicketCount, bankName: bankName || null, bankLogoUrl: bankLogoUrl || null, accountHolder: accountHolder || null, accountNumber: accountNumber || null, iban: iban || null, facebookPageUrl: facebookPageUrl || null, heroEyebrow: heroEyebrow || null, heroOverline: heroOverline || null, faqContent: faqContent || null, stepsContent: stepsContent || null, closingTitle: closingTitle || null, footerDescription: footerDescription || null, status } });
    await tx.adminAuditLog.create({ data: { action: "CAMPAIGN_SETTINGS_UPDATE", details: { campaignId: row.id, title, status, hasHeroImage: Boolean(heroImageUrl) } } });
    return row;
  });
  return NextResponse.json({ ok: true, campaign: { id: updated.id, title: updated.title, description: updated.description, heroImageUrl: updated.heroImageUrl, targetTicketCount: updated.targetTicketCount, bankName: updated.bankName, bankLogoUrl: updated.bankLogoUrl, accountHolder: updated.accountHolder, accountNumber: updated.accountNumber, iban: updated.iban, facebookPageUrl: updated.facebookPageUrl, heroEyebrow: updated.heroEyebrow, heroOverline: updated.heroOverline, faqContent: updated.faqContent, stepsContent: updated.stepsContent, closingTitle: updated.closingTitle, footerDescription: updated.footerDescription, status: updated.status } });
}
