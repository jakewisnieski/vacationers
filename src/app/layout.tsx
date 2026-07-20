import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

// Wanderlust · Nightfall: serif display headings over a sans body (#9).
const sansBody = Inter({
  variable: "--font-sans-body",
  subsets: ["latin"],
});

const serifDisplay = Fraunces({
  variable: "--font-serif-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vacationers",
  description:
    "One source of truth for planning your friend group's annual vacation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sansBody.variable} ${serifDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
