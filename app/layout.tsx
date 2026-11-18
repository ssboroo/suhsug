import type { Metadata } from "next";
import "./globals.css";

const description = "Сүхбаатарын хурд морины сугалааны эрхээ утасны дугаараар шалгана уу.";
export const metadata: Metadata = {
  title: "Сүхбаатарын хурд | Сугалааны эрх шалгах",
  description,
  openGraph: {
    title: "СҮХБААТАРЫН ХУРД — МОРИНЫ СУГАЛАА",
    description,
    type: "website",
    locale: "mn_MN",
    images: [{ url: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&h=630&q=85", width: 1200, height: 630, alt: "Хурдан морь" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Сүхбаатарын хурд",
    description,
    images: ["https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&h=630&q=85"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="mn"><body>{children}</body></html>;
}