import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NeonSmokeBackground } from "../components/NeonSmokeBackground";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampVion | Intelligent Campus Operations",
  description:
    "CampVion — Intelligent Campus Operations & Autonomous Agentic AI Assistant for Multi-Step Campus Service Workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-[#000000] text-[#F1F4FA] flex flex-col selection:bg-[#00FF66]/25 selection:text-[#F1F4FA] relative">
        <NeonSmokeBackground />
        <div className="relative z-10 flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
