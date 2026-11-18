import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Сүхбаатарын хурд | Сугалааны эрх шалгах",
  description: "Сүхбаатарын хурд морины сугалааны эрхээ утасны дугаараар шалгана уу.",
  openGraph: {
    title: "Сүхбаатарын хурд",
    description: "Морины сугалааны эрх шалгах",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="mn"><body>{children}</body></html>;
}