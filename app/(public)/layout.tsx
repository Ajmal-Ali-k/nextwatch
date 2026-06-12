import Navbar from "@/components/Navbar";
import { DefaultPageReveal } from "@/components/DefaultPageReveal";
import Footer from "@/components/footer";
import { QueryProvider } from "@/components/QueryProvider";
import { RegionLanguageProvider } from "@/components/RegionLanguageProvider";
import { getServerHomePreferences } from "@/lib/server/homePreferences";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefs = await getServerHomePreferences();

  return (
    <div className="font-gilroy bg-black text-white min-h-screen">
      <RegionLanguageProvider
        initialWatchRegion={prefs.watchRegion}
        initialLanguages={prefs.languages}
      >
        <QueryProvider>
          <Navbar />
          <DefaultPageReveal>
            {children}
            <Footer />
          </DefaultPageReveal>
        </QueryProvider>
      </RegionLanguageProvider>
    </div>
  );
}
