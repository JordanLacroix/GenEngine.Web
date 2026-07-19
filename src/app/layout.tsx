import type { Metadata } from "next";
import { AudioProvider } from "@/shared/audio/audio-provider";
import { FeedbackProvider } from "@/shared/ui/feedback-provider";
import { Navigation } from "@/shared/ui/navigation";
import { applicationNameOf, fetchClientBootstrap } from "@/shared/api/client-bootstrap";
import { brandingStyleSheet } from "@/shared/ui/branding-theme";
import "./globals.css";
import "./platform.css";
import "./home.css";
import "./studio.css";
import "./shell.css";

/**
 * Le titre du document porte le nom de l'**instance**, pas celui du moteur.
 *
 * `GET /client-bootstrap/{frontId}` est anonyme précisément pour que ce premier
 * écran soit peignable avant toute authentification. Une configuration
 * illisible retombe sur « GenEngine ».
 */
export async function generateMetadata(): Promise<Metadata> {
  const bootstrap = await fetchClientBootstrap();
  const name = applicationNameOf(bootstrap);
  const tagline = bootstrap?.branding?.tagline?.trim() || bootstrap?.tagline?.trim();
  return {
    title: { default: tagline ? `${name} — ${tagline}` : name, template: `%s · ${name}` },
    description: tagline
      ?? "Un moteur narratif entièrement paramétrable et son interface de configuration, "
      + "pour les écoles d’ingénieurs, les entreprises et les organismes de formation professionnelle.",
    icons: bootstrap?.branding?.faviconUrl ? { icon: bootstrap.branding.faviconUrl } : undefined,
  };
}

/**
 * Coque immersive : le corps du document occupe le viewport, `main` porte le
 * défilement et la navigation est une surcouche HUD. Le pied de page vit dans la
 * scène pour qu'aucun chrome de page ne borde l'application.
 */
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const bootstrap = await fetchClientBootstrap();
  const applicationName = applicationNameOf(bootstrap);
  // La palette publiée est posée sur `:root` **au rendu serveur** : les
  // variables existent avant la première peinture, donc aucune bascule de
  // couleur n'est visible. Chaque feuille les consomme avec un repli littéral,
  // et une instance sans `branding` rend exactement comme aujourd'hui.
  const brandingStyles = brandingStyleSheet(bootstrap?.branding);
  return (
    <html lang={bootstrap?.locale?.split("-")[0] ?? "fr"}>
      <body>
        {brandingStyles && <style data-branding="published">{brandingStyles}</style>}
        <a className="skip-link" href="#main-content">Aller au contenu</a>
        <div className="ambient ambient-one" aria-hidden="true" />
        <div className="ambient ambient-two" aria-hidden="true" />
        <AudioProvider>
          <FeedbackProvider>
            <Navigation applicationName={applicationName} />
            <main id="main-content">
              {children}
              <footer className="site-footer">
                <span>{applicationName}</span>
                <p>Propulsé par GenEngine, moteur narratif configurable</p>
                <span>2026</span>
              </footer>
            </main>
          </FeedbackProvider>
        </AudioProvider>
      </body>
    </html>
  );
}
