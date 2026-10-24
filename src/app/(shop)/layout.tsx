import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";
import { MobileNav } from "@/components/shop/MobileNav";
import { FloatingActions } from "@/components/shop/FloatingActions";
import { getSettings } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { telHref, whatsappHref } from "@/lib/format";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  return (
    <div className="flex min-h-dvh flex-col pb-20 md:pb-0">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileNav phoneHref={telHref(settings.phone)} />
      <FloatingActions
        shopName={settings.shop_name}
        whatsappUrl={whatsappHref(settings.whatsapp, "Bonjour, j’ai une question.")}
        userId={user?.id}
        defaultName={user?.profile?.full_name}
        defaultPhone={user?.profile?.phone}
      />
    </div>
  );
}
