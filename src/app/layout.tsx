import type { Metadata } from "next";
import { Navigation } from "@/shared/ui/navigation";
import "./globals.css";
import "./platform.css";

export const metadata: Metadata = {
  title: { default: "GenEngine — Des mondes qui se souviennent", template: "%s · GenEngine" },
  description: "Découvrez, créez et vivez des récits interactifs qui répondent à vos choix.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <a className="skip-link" href="#main-content">Aller au contenu</a>
        <div className="ambient ambient-one" aria-hidden="true" />
        <div className="ambient ambient-two" aria-hidden="true" />
        <Navigation />
        <main id="main-content">{children}</main>
        <footer className="site-footer"><span>GenEngine</span><p>Des histoires qui se souviennent de vous.</p><span>Prototype produit · 2026</span></footer>
      </body>
    </html>
  );
}
