import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PromoBar from "@/components/PromoBar";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PromoBar />
      <Header />
      {children}
      <Footer />
      <WhatsAppButton />
    </>
  );
}
