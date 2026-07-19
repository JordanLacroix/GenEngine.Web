"use client";

import {
  Bot, Feather, Languages, LibraryBig, LoaderCircle, Music4, Save, Sparkles, UploadCloud,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  AdminConfigurationContract, ExperienceDocumentContract, ProblemDetailsContract,
  PublishedExperienceContract,
} from "@/shared/api/contracts";
import { SectionNav } from "@/shared/ui/section-nav";
import { mediaSupport } from "../model/media-configuration";
import { useAssetPack } from "./asset-field";
import { CatalogSection, type DocumentUpdate, FamiliarSection, GameSection, WordingSection } from "./configuration-sections";
import { MediaSection } from "./media-section";
import { ScenarioSection } from "./scenario-section";

type Section = "game" | "catalog" | "familiar" | "wording" | "media" | "scenarios";
const sections: Array<{ id: Section; label: string; icon: typeof Sparkles; description: string }> = [
  { id: "game", label: "Le jeu", icon: Sparkles, description: "Nom, description, histoire globale et organisation." },
  { id: "catalog", label: "Catégories & parcours", icon: LibraryBig, description: "Les postures, leur ordre et leurs prérequis." },
  { id: "familiar", label: "Familier", icon: Bot, description: "Le compagnon par défaut et sa voix." },
  { id: "wording", label: "Libellés", icon: Languages, description: "Le vocabulaire du jeu, clé par clé." },
  { id: "media", label: "Médias", icon: Music4, description: "Ce que l’on voit et entend, lieu par lieu." },
  { id: "scenarios", label: "Scénarios", icon: Feather, description: "Scènes, choix, visuels, sons et interactions." },
];

/**
 * Studio : la surface où un client configure son propre jeu.
 *
 * Le document de configuration reste celui du plan de contrôle : le Studio le
 * lit, le modifie et le renvoie tel quel, en conservant les champs qu'il ne
 * connaît pas. Ce que l'instance n'expose pas — le bloc média aujourd'hui — est
 * annoncé comme absent plutôt que simulé.
 */
export function StudioShell() {
  const [section, setSection] = useState<Section>("game");
  const [configuration, setConfiguration] = useState<AdminConfigurationContract>();
  const [published, setPublished] = useState<PublishedExperienceContract>();
  const [configurationError, setConfigurationError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(true);
  const pack = useAssetPack();

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/configuration", { signal: controller.signal })
      .then((response) => read<AdminConfigurationContract>(response))
      .then(setConfiguration)
      .catch((error: unknown) => setConfigurationError(asMessage(error)))
      .finally(() => setBusy(false));
    void fetch("/api/experience", { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<PublishedExperienceContract> : undefined)
      .then(setPublished)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const update: DocumentUpdate = (mutator) => {
    setConfiguration((current) => current ? { ...current, document: mutator(current.document) } : current);
    setDirty(true);
  };

  async function persist(publish: boolean) {
    if (!configuration) return;
    setBusy(true); setMessage(undefined);
    try {
      const saved = await read<AdminConfigurationContract>(await fetch("/api/admin/configuration", {
        method: publish ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publish
          ? { expectedRevision: configuration.revision }
          : { expectedRevision: configuration.revision, document: configuration.document }),
      }));
      setConfiguration(saved);
      setDirty(false);
      setMessage(publish ? `Configuration publiée en version ${saved.publishedVersion}.` : "Brouillon de configuration enregistré.");
    } catch (error) { setMessage(asMessage(error)); } finally { setBusy(false); }
  }

  // Le document de référence pour les sections qui n'écrivent pas : le brouillon
  // s'il est lisible, sinon la version publiée. Jamais une fixture.
  const document: ExperienceDocumentContract | undefined = configuration?.document ?? published?.document;
  const packAbsentReason = pack.error
    ?? (pack.loading ? undefined : "Aucun pack d’assets n’est publié sur cette instance : seules les URLs HTTPS sont assignables.");

  return (
    <section className="studio-console app-fullscreen">
      <aside className="studio-sidebar">
        <SectionNav label="Studio" />
        <div className="admin-status">
          <span className="status-dot" />
          <div>
            <small>Version publiée</small>
            <strong>{configuration ? `v${configuration.publishedVersion}` : "—"}</strong>
          </div>
        </div>
        {sections.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={section === id ? "is-active" : ""} onClick={() => setSection(id)} aria-current={section === id ? "true" : undefined}>
            <Icon aria-hidden="true" />{label}
          </button>
        ))}
        <div className="admin-actions">
          <button type="button" className="button button--quiet" disabled={busy || !configuration || !dirty} onClick={() => persist(false)}>
            <Save aria-hidden="true" /> Enregistrer
          </button>
          <button type="button" className="button button--primary" disabled={busy || !configuration} onClick={() => persist(true)}>
            <UploadCloud aria-hidden="true" /> Publier
          </button>
        </div>
        {dirty && <p className="studio-note">Modifications non enregistrées.</p>}
      </aside>

      <div className="studio-content">
        <header className="studio-section-head">
          <div>
            <p className="eyebrow">{sections.find((item) => item.id === section)?.label}</p>
            <p>{sections.find((item) => item.id === section)?.description}</p>
          </div>
          {busy && <LoaderCircle className="spin" aria-label="Chargement en cours" />}
        </header>
        {message && <p className="admin-message" role="status">{message}</p>}
        {configurationError && (
          <p className="studio-error" role="alert">
            Configuration non modifiable ({configurationError}). Les sections d’édition restent fermées ;
            aucune valeur locale ne remplace le plan de configuration réel.
          </p>
        )}
        {pack.error && <p className="studio-error" role="alert">Catalogue d’assets : {pack.error}</p>}

        {section === "scenarios"
          ? <ScenarioSection document={document} manifest={pack.manifest} packAbsentReason={packAbsentReason} />
          : configuration
            ? <>
              {section === "game" && <GameSection document={configuration.document} update={update} manifest={pack.manifest} />}
              {section === "catalog" && <CatalogSection document={configuration.document} update={update} manifest={pack.manifest} packAbsentReason={packAbsentReason} />}
              {section === "familiar" && <FamiliarSection document={configuration.document} update={update} manifest={pack.manifest} packAbsentReason={packAbsentReason} />}
              {section === "wording" && <WordingSection document={configuration.document} update={update} />}
              {section === "media" && <MediaSection support={mediaSupport(configuration.document)} manifest={pack.manifest} packAbsentReason={packAbsentReason} onChange={(media) => update((value) => ({ ...value, media }))} />}
            </>
            : !busy && !configurationError && <p className="studio-note">Configuration indisponible.</p>}
      </div>
    </section>
  );
}

function asMessage(error: unknown) { return error instanceof Error ? error.message : "Une erreur inattendue est survenue."; }
async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const problem = await response.json().catch(() => undefined) as ProblemDetailsContract | undefined;
    throw new Error(problem?.detail ?? problem?.title ?? `Le service a répondu ${response.status}.`);
  }
  return response.json() as Promise<T>;
}
