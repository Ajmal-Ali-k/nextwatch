import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter_Tight, Anton, Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const gilroy = localFont({
  src: "../public/fonts/Gilroy-Regular.woff2",
  variable: "--font-gilroy",
  display: "swap",
});

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "NextWatch",
  description: "NextWatch application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={cn("font-sans", geist.variable)}
    >
      <body
        suppressHydrationWarning={true}
        className={`${interTight.variable} ${anton.variable} ${gilroy.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
