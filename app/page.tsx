import type { Metadata } from "next";
import { db } from "@/lib/db";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

const fallbackImage = "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&h=630&q=85";

export async function generateMetadata(): Promise<Metadata> {
  const campaign = await db.campaign.findFirst({
    where: { isActive: true, status: "PUBLISHED" },
    select: { title: true, description: true, heroImageUrl: true }
  }).catch(() => null);
  const title = campaign?.title || "Сүхбаатарын хурд — Морины сугалаа";
  const description = campaign?.description || "Сүхбаатарын хурд морины сугалааны эрхээ утасны дугаараар шалгана уу.";
  const image = campaign?.heroImageUrl || fallbackImage;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: "mn_MN", images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] }
  };
}

export default function HomePage() {
  return <HomeClient />;
}
