import type { Metadata } from "next";
import { Orbitron, Exo_2 } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartToast } from "@/components/CartToast";


const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const exo2 = Exo_2({
  subsets: ["latin"],
  variable: "--font-exo2",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Swzzle Liniment — Science Wins. So Should You.",
  description:
    "Swzzle builds the simplest, most effective tools to turn any standard-issue human body into a high-performance machine. Engineered for athletes, made in McConnelsville, Ohio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${exo2.variable}`}>
      <body className="font-body bg-background text-foreground min-h-screen flex flex-col">
        <AnnouncementBar />
        <Navbar />
        <CartToast />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
