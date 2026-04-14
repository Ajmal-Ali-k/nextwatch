import Navbar from "@/components/Navbar";
import { DefaultPageReveal } from "@/components/DefaultPageReveal";
import Footer from "@/components/footer";
import { QueryProvider } from "@/components/QueryProvider";
import { RegionLanguageProvider } from "@/components/RegionLanguageProvider";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-gilroy bg-black text-white min-h-screen">
      <RegionLanguageProvider>
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
