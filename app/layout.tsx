import type { Metadata } from "next";
import "./globals.css";

const description = "Сүхбаатарын хурд — Сугалаат худалдаа. Сугалааны эрхээ утасны дугаараар шалгаарай.";
export const metadata: Metadata = {
  title: "Сүхбаатарын хурд — Сугалаат худалдаа",
  description,
  openGraph: {
    title: "СҮХБААТАРЫН ХУРД — СУГАЛААТ ХУДАЛДАА",
    description,
    type: "website",
    locale: "mn_MN",
    images: [{ url: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&h=630&q=85", width: 1200, height: 630, alt: "Хурдан морь" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Сүхбаатарын хурд — Сугалаат худалдаа",
    description,
    images: ["https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&h=630&q=85"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="mn"><body>{children}</body></html>;
}