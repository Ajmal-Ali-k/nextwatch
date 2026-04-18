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
  description: "Watchlist for movies and TV shows",
  icons: {
    icon: "/favicon.ico",
  },
  // manifest: "/manifest.json",
  // themeColor: "#000000",
  // viewport: {
  //   width: "device-width",
  //   initialScale: 1,
  //   maximumScale: 1,
  //   userScalable: false,
  // },
  // openGraph: {
  //   title: "NextWatch",
  //   description: "Watchlist for movies and TV shows",
  //   url: "https://nextwatchlist.com/",
  //   siteName: "NextWatchList",
  //   images: [
  //     {
  //       url: "/og-image.png",
  //       width: 1200,
  //       height: 630,
  //       alt: "NextWatchList",
  //     },
  //   ],
  // },
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
