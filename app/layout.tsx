import type { Metadata } from "next";
import { Inter_Tight, Anton } from "next/font/google";
import Navbar from "@/components/Navbar";
import { DefaultPageReveal } from "@/components/DefaultPageReveal";
import Footer from "@/components/footer";
import { QueryProvider } from "@/components/QueryProvider";
import { RegionLanguageProvider } from "@/components/RegionLanguageProvider";
import "./globals.css";

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


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${interTight.variable} ${anton.variable} antialiased bg-neutral-900 text-white`}
      >
        <RegionLanguageProvider>
          <QueryProvider>
            <Navbar />
            <DefaultPageReveal>
              {children}
              <Footer />
            </DefaultPageReveal>
          </QueryProvider>
        </RegionLanguageProvider>
      </body>
    </html>
  );
}
