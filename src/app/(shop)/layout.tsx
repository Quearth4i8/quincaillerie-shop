import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";
import { MobileNav } from "@/components/shop/MobileNav";
import { getSettings } from "@/lib/data";
import { telHref } from "@/lib/format";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <div className="flex min-h-dvh flex-col pb-20 md:pb-0">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileNav phoneHref={telHref(settings.phone)} />
    </div>
  );
}
