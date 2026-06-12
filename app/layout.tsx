import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter_Tight, Anton, Geist } from "next/font/google";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  DEFAULT_TWITTER_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
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
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_TWITTER_IMAGE],
  },
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
