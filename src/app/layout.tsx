import type { Metadata } from "next";
import { AudioProvider } from "@/shared/audio/audio-provider";
import { FeedbackProvider } from "@/shared/ui/feedback-provider";
import { Navigation } from "@/shared/ui/navigation";
import "./globals.css";
import "./platform.css";
import "./home.css";
import "./studio.css";
import "./shell.css";

export const metadata: Metadata = {
  title: { default: "GenEngine — le moteur narratif configurable", template: "%s · GenEngine" },
  description:
    "GenEngine est un moteur narratif entièrement paramétrable et son interface de configuration, "
    + "pour les écoles d’ingénieurs, les entreprises et les organismes de formation professionnelle.",
};

/**
 * Coque immersive : le corps du document occupe le viewport, `main` porte le
 * défilement et la navigation est une surcouche HUD. Le pied de page vit dans la
 * scène pour qu'aucun chrome de page ne borde l'application.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <a className="skip-link" href="#main-content">Aller au contenu</a>
        <div className="ambient ambient-one" aria-hidden="true" />
        <div className="ambient ambient-two" aria-hidden="true" />
        <AudioProvider>
          <FeedbackProvider>
            <Navigation />
            <main id="main-content">
              {children}
              <footer className="site-footer">
                <span>GenEngine</span>
                <p>Moteur narratif configurable · configuration de référence « Le Diapason »</p>
                <span>2026</span>
              </footer>
            </main>
          </FeedbackProvider>
        </AudioProvider>
      </body>
    </html>
  );
}
