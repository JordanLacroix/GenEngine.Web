"use client";

import { BookOpen, Compass, Info, Plus, Settings2, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ExperienceDocumentContract } from "@/shared/api/contracts";
import type { AssetPackManifest } from "@/shared/assets/asset-pack";
import { resolveAssetReference } from "@/shared/assets/asset-pack";
import { ConfiguredField } from "@/shared/ui/field-help";
import { gameCopy } from "@/shared/lib/game-copy";
import { AssetField } from "./asset-field";

type Document = ExperienceDocumentContract;
export type DocumentUpdate = (mutator: (document: Document) => Document) => void;

/** Teintes nommées de la direction artistique, utilisées par les accents configurés. */
const accents: Record<string, string> = {
  ember: "#d7a746", or: "#d7a746", verdigris: "#2f7fa0", azur: "#2f7fa0",
  sauge: "#7a9a55", encre: "#17344a", ivoire: "#fffaf0",
};
export function accentColor(accent: string | undefined): string {
  return (accent && accents[accent]) ?? "#2f7fa0";
}

/** Identité du jeu : ce que le joueur lit avant même de jouer. */
export function GameSection({ document, update, manifest }: { document: Document; update: DocumentUpdate; manifest?: AssetPackManifest }) {
  const home = document.media?.locations.find((entry) => entry.location === "home");
  const background = home?.backgroundUrl ? resolveAssetReference(home.backgroundUrl, manifest) : undefined;
  return (
    <div className="studio-panel studio-split">
      <div className="studio-form">
        <ConfiguredField label="Nom du jeu" path="game.name">
          <input value={document.game.name} onChange={(event) => update((value) => ({ ...value, game: { ...value.game, name: event.target.value } }))} />
        </ConfiguredField>
        <ConfiguredField label="Description" path="game.description">
          <textarea value={document.game.description} onChange={(event) => update((value) => ({ ...value, game: { ...value.game, description: event.target.value } }))} />
        </ConfiguredField>
        <ConfiguredField label="Histoire globale" path="game.globalStory">
          <textarea className="large" value={document.game.globalStory} onChange={(event) => update((value) => ({ ...value, game: { ...value.game, globalStory: event.target.value } }))} />
        </ConfiguredField>
        <div className="studio-inline-fields">
          <ConfiguredField label="Langue" path="game.locale">
            <input value={document.game.locale} onChange={(event) => update((value) => ({ ...value, game: { ...value.game, locale: event.target.value } }))} />
          </ConfiguredField>
          <ConfiguredField label="Fuseau horaire" path="game.timeZone">
            <input value={document.game.timeZone} onChange={(event) => update((value) => ({ ...value, game: { ...value.game, timeZone: event.target.value } }))} />
          </ConfiguredField>
          <ConfiguredField label="Type d’organisation" path="organizationType">
            <select value={document.organizationType} onChange={(event) => update((value) => ({ ...value, organizationType: event.target.value as Document["organizationType"] }))}>
              {(["School", "Company", "TrainingProvider", "Community", "Custom"] as const).map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </ConfiguredField>
        </div>
        <ConfiguredField label="Nom de l’organisation" path="organization.name">
          <input value={document.organization.name} onChange={(event) => update((value) => ({ ...value, organization: { ...value.organization, name: event.target.value } }))} />
        </ConfiguredField>
      </div>
      <figure className="surface-preview">
        <div className="surface-frame" style={background?.kind === "image" ? { backgroundImage: `url(${background.url})` } : undefined}>
          <div className="surface-hud"><span /><span /><span /></div>
          <div className="surface-body">
            <p className="eyebrow">{document.organization.name}</p>
            <strong>{document.game.name || "Sans nom"}</strong>
            <small>{document.game.description || "Aucune description configurée."}</small>
          </div>
        </div>
        <figcaption>Aperçu de l’ouverture, avec le fond configuré pour l’accueil.</figcaption>
      </figure>
    </div>
  );
}

/** Catégories, parcours et prérequis : la structure que la carte donne à voir. */
export function CatalogSection({ document, update, manifest, packAbsentReason }: {
  document: Document; update: DocumentUpdate; manifest?: AssetPackManifest; packAbsentReason?: string;
}) {
  return (
    <div className="studio-panel">
      <p className="studio-note"><Info aria-hidden="true" />Une catégorie est une posture (« Lucidité »…). Un parcours ordonne des catégories et peut exiger d’autres parcours en prérequis.</p>

      <h3>Catégories</h3>
      <div className="config-cards">
        {document.categories.map((category) => (
          <article key={category.id}>
            <button type="button" className="icon-danger" aria-label={`Supprimer ${category.name}`} onClick={() => update((value) => ({
              ...value,
              categories: value.categories.filter((item) => item.id !== category.id),
              journeys: value.journeys.map((journey) => ({ ...journey, categoryIds: journey.categoryIds.filter((id) => id !== category.id) })),
            }))}><Trash2 aria-hidden="true" /></button>
            <span className="category-gem" style={{ background: accentColor(category.accent) }} />
            <ConfiguredField label="Nom" path="categories[].name"><input value={category.name} onChange={(event) => update((value) => ({ ...value, categories: value.categories.map((item) => item.id === category.id ? { ...item, name: event.target.value } : item) }))} /></ConfiguredField>
            <ConfiguredField label="Description" path="categories[].description"><textarea value={category.description} onChange={(event) => update((value) => ({ ...value, categories: value.categories.map((item) => item.id === category.id ? { ...item, description: event.target.value } : item) }))} /></ConfiguredField>
            <div className="studio-inline-fields">
              <ConfiguredField label="Accent" path="categories[].accent">
                <select value={category.accent} onChange={(event) => update((value) => ({ ...value, categories: value.categories.map((item) => item.id === category.id ? { ...item, accent: event.target.value } : item) }))}>
                  {Object.keys(accents).map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </ConfiguredField>
              <label className="studio-switch">
                <input type="checkbox" checked={category.isVisible} onChange={(event) => update((value) => ({ ...value, categories: value.categories.map((item) => item.id === category.id ? { ...item, isVisible: event.target.checked } : item) }))} />
                <span>Visible</span>
              </label>
            </div>
            <AssetField
              id={`category-${category.id}-image`} kind="image" manifest={manifest} packAbsentReason={packAbsentReason}
              label="Illustration" path="categories[].imageUrl" value={category.imageUrl ?? ""}
              onChange={(next) => update((value) => ({ ...value, categories: value.categories.map((item) => item.id === category.id ? { ...item, imageUrl: next || undefined } : item) }))}
            />
            <ConfiguredField label="Identifiants de scénarios (séparés par des virgules)" path="categories[].scenarioIds[]">
              <input value={category.scenarioIds.join(", ")} onChange={(event) => update((value) => ({ ...value, categories: value.categories.map((item) => item.id === category.id ? { ...item, scenarioIds: event.target.value.split(",").map((id) => id.trim()).filter(Boolean) } : item) }))} />
            </ConfiguredField>
          </article>
        ))}
      </div>
      <button type="button" className="button button--quiet" onClick={() => update((value) => ({
        ...value,
        categories: [...value.categories, { id: crypto.randomUUID(), name: "Nouvelle catégorie", description: "", accent: "azur", order: value.categories.length + 1, isVisible: true, tags: [], scenarioIds: [] }],
      }))}><Plus aria-hidden="true" /> Ajouter une catégorie</button>

      <h3>Parcours et prérequis</h3>
      <div className="config-cards">
        {document.journeys.map((journey) => (
          <article key={journey.id}>
            <button type="button" className="icon-danger" aria-label={`Supprimer ${journey.name}`} onClick={() => update((value) => ({
              ...value,
              journeys: value.journeys.filter((item) => item.id !== journey.id).map((item) => ({ ...item, prerequisiteJourneyIds: item.prerequisiteJourneyIds.filter((id) => id !== journey.id) })),
            }))}><Trash2 aria-hidden="true" /></button>
            <ConfiguredField label="Nom" path="journeys[].name"><input value={journey.name} onChange={(event) => update((value) => ({ ...value, journeys: value.journeys.map((item) => item.id === journey.id ? { ...item, name: event.target.value } : item) }))} /></ConfiguredField>
            <ConfiguredField label="Description" path="journeys[].description"><textarea value={journey.description} onChange={(event) => update((value) => ({ ...value, journeys: value.journeys.map((item) => item.id === journey.id ? { ...item, description: event.target.value } : item) }))} /></ConfiguredField>
            <fieldset className="permission-picker">
              <legend>Catégories du parcours</legend>
              {document.categories.map((category) => (
                <label key={category.id}>
                  <input type="checkbox" checked={journey.categoryIds.includes(category.id)} onChange={() => update((value) => ({
                    ...value,
                    journeys: value.journeys.map((item) => item.id === journey.id ? { ...item, categoryIds: item.categoryIds.includes(category.id) ? item.categoryIds.filter((id) => id !== category.id) : [...item.categoryIds, category.id] } : item),
                  }))} />
                  <span><strong>{category.name}</strong><small>{category.description}</small></span>
                </label>
              ))}
            </fieldset>
            <fieldset className="permission-picker">
              <legend>Parcours exigés en prérequis</legend>
              {document.journeys.filter((candidate) => candidate.id !== journey.id).map((candidate) => (
                <label key={candidate.id}>
                  <input type="checkbox" checked={journey.prerequisiteJourneyIds.includes(candidate.id)} onChange={() => update((value) => ({
                    ...value,
                    journeys: value.journeys.map((item) => item.id === journey.id ? { ...item, prerequisiteJourneyIds: item.prerequisiteJourneyIds.includes(candidate.id) ? item.prerequisiteJourneyIds.filter((id) => id !== candidate.id) : [...item.prerequisiteJourneyIds, candidate.id] } : item),
                  }))} />
                  <span><strong>{candidate.name}</strong></span>
                </label>
              ))}
              {document.journeys.length < 2 && <p className="studio-note">Un seul parcours est configuré : aucun prérequis possible.</p>}
            </fieldset>
          </article>
        ))}
      </div>
      <button type="button" className="button button--quiet" onClick={() => update((value) => ({
        ...value,
        journeys: [...value.journeys, { id: crypto.randomUUID(), name: "Nouveau parcours", description: "", accent: "or", order: value.journeys.length + 1, isVisible: true, categoryIds: [], prerequisiteJourneyIds: [], tags: [] }],
      }))}><Plus aria-hidden="true" /> Ajouter un parcours</button>

      <MapPreview document={document} manifest={manifest} />
    </div>
  );
}

/** Aperçu de la carte : une porte par catégorie visible, avec son accent réel. */
function MapPreview({ document, manifest }: { document: Document; manifest?: AssetPackManifest }) {
  const map = document.media?.locations.find((entry) => entry.location === "map");
  const background = map?.backgroundUrl ? resolveAssetReference(map.backgroundUrl, manifest) : undefined;
  const visible = document.categories.filter((category) => category.isVisible);
  return (
    <figure className="surface-preview is-wide">
      <div className="surface-frame" style={background?.kind === "image" ? { backgroundImage: `url(${background.url})` } : undefined}>
        <div className="surface-hud"><span /><span /><span /></div>
        <div className="surface-doors">
          {visible.length === 0
            ? <p className="studio-note">Aucune catégorie visible : la carte n’afficherait aucune porte.</p>
            : visible.map((category) => (
              <span key={category.id} className="surface-door" style={{ borderColor: accentColor(category.accent) }}>
                <b style={{ background: accentColor(category.accent) }} />
                {category.name}
                <small>{category.scenarioIds.length} scénario(s)</small>
              </span>
            ))}
        </div>
      </div>
      <figcaption>Aperçu de la carte : une porte par catégorie visible, avec le nombre de scénarios rattachés.</figcaption>
    </figure>
  );
}

/** Familier : le compagnon par défaut proposé à chaque joueur. */
export function FamiliarSection({ document, update, manifest, packAbsentReason }: {
  document: Document; update: DocumentUpdate; manifest?: AssetPackManifest; packAbsentReason?: string;
}) {
  const familiar = document.familiars[0];
  if (!familiar) return <div className="studio-panel"><p className="studio-note"><Info aria-hidden="true" />Aucun familier n’est défini dans cette configuration.</p></div>;
  const patch = (fields: Partial<Document["familiars"][number]>) => update((value) => ({
    ...value, familiars: value.familiars.map((item, index) => index === 0 ? { ...item, ...fields } : item),
  }));
  const portrait = familiar.portraitUrl ? resolveAssetReference(familiar.portraitUrl, manifest) : undefined;
  return (
    <div className="studio-panel studio-split">
      <div className="studio-form">
        <ConfiguredField label="Nom" path="familiars[].name"><input value={familiar.name} onChange={(event) => patch({ name: event.target.value })} /></ConfiguredField>
        <ConfiguredField label="Description" path="familiars[].description"><textarea value={familiar.description} onChange={(event) => patch({ description: event.target.value })} /></ConfiguredField>
        <div className="studio-inline-fields">
          <ConfiguredField label="Forme" path="familiars[].form">
            <select value={familiar.form} onChange={(event) => patch({ form: event.target.value })}>
              {[familiar.form, ...familiar.availableForms.filter((form) => form !== familiar.form)].map((form) => <option key={form} value={form}>{form}</option>)}
            </select>
          </ConfiguredField>
          <ConfiguredField label="Ton" path="familiars[].tone">
            <select value={familiar.tone} onChange={(event) => patch({ tone: event.target.value })}>
              {[familiar.tone, ...familiar.availableTones.filter((tone) => tone !== familiar.tone)].map((tone) => <option key={tone} value={tone}>{tone}</option>)}
            </select>
          </ConfiguredField>
          <ConfiguredField label="Style d’écriture" path="familiars[].writingStyle"><input value={familiar.writingStyle} onChange={(event) => patch({ writingStyle: event.target.value })} /></ConfiguredField>
        </div>
        <ConfiguredField label="Accent" path="familiars[].accent">
          <select value={familiar.accent} onChange={(event) => patch({ accent: event.target.value })}>
            {Object.keys(accents).map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </ConfiguredField>
        <ConfiguredField label={`Niveau d’aide : ${familiar.helpLevel}/5`} path="familiars[].helpLevel">
          <input type="range" min={0} max={5} value={familiar.helpLevel} onChange={(event) => patch({ helpLevel: Number(event.target.value) })} />
        </ConfiguredField>
        <AssetField
          id="familiar-portrait" kind="image" manifest={manifest} packAbsentReason={packAbsentReason}
          label="Portrait" path="familiars[].portraitUrl" value={familiar.portraitUrl ?? ""} onChange={(next) => patch({ portraitUrl: next || undefined })}
        />
        <div className="studio-inline-fields">
          <ConfiguredField label="Licence" path="familiars[].license"><input value={familiar.license ?? ""} onChange={(event) => patch({ license: event.target.value || undefined })} /></ConfiguredField>
          <ConfiguredField label="Attribution" path="familiars[].attribution"><input value={familiar.attribution ?? ""} onChange={(event) => patch({ attribution: event.target.value || undefined })} /></ConfiguredField>
        </div>
      </div>
      <figure className="surface-preview">
        <div className="surface-frame familiar-frame" style={{ "--familiar-accent": accentColor(familiar.accent) } as React.CSSProperties}>
          <div className="surface-hud"><span /><span /><span /></div>
          <div className="surface-body">
            {portrait?.kind === "image"
              ? <img className="familiar-portrait" src={portrait.url} alt="" />
              : <span className="familiar-orb" aria-hidden="true">✦</span>}
            <strong>{familiar.name || "Familier sans nom"}</strong>
            <small>{sampleLine(familiar)}</small>
          </div>
        </div>
        <figcaption>Réplique d’exemple recomposée à partir du ton, du style et du niveau d’aide.</figcaption>
      </figure>
    </div>
  );
}

/** Réplique reconstruite localement : elle illustre les réglages, elle ne vient pas du moteur. */
function sampleLine(familiar: Document["familiars"][number]): string {
  const opening = familiar.tone.toLowerCase().includes("sec") ? "Bon." : familiar.tone.toLowerCase().includes("chaleur") ? "Prends ton temps." : "Regarde.";
  const help = familiar.helpLevel >= 4
    ? "Je te donne la piste : commence par relire ce que la voix a dit."
    : familiar.helpLevel >= 2 ? "Je peux t’orienter si tu le demandes." : "Je te laisse chercher.";
  return `${opening} ${help} (${familiar.writingStyle || "style non précisé"})`;
}

/** Libellés : le vocabulaire du jeu, sans texte imposé par le produit. */
export function WordingSection({ document, update }: { document: Document; update: DocumentUpdate }) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const labels = Object.entries(document.language.labels).sort(([left], [right]) => left.localeCompare(right));
  const setLabel = (labelKey: string, next: string | undefined) => update((current) => {
    const nextLabels = { ...current.language.labels };
    if (next === undefined) delete nextLabels[labelKey]; else nextLabels[labelKey] = next;
    return { ...current, language: { labels: nextLabels } };
  });
  return (
    <div className="studio-panel studio-split">
      <div className="studio-form">
        <p className="studio-note"><Info aria-hidden="true" />Chaque texte porte une clé stable. Une clé absente retombe sur la valeur par défaut du client.</p>
        <div className="wording-list">
          {labels.map(([labelKey, labelValue]) => (
            <div key={labelKey} className="wording-row">
              <code>{labelKey}</code>
              <input aria-label={`Valeur de ${labelKey}`} value={labelValue} onChange={(event) => setLabel(labelKey, event.target.value)} />
              <button type="button" className="icon-danger" aria-label={`Supprimer ${labelKey}`} onClick={() => setLabel(labelKey, undefined)}><Trash2 aria-hidden="true" /></button>
            </div>
          ))}
          {labels.length === 0 && <p className="studio-note">Aucun libellé personnalisé : le client utilise ses valeurs par défaut.</p>}
        </div>
        <div className="studio-inline-fields">
          <label>Nouvelle clé<input value={key} onChange={(event) => setKey(event.target.value)} placeholder="ex. nav.library" /></label>
          <label>Texte<input value={value} onChange={(event) => setValue(event.target.value)} /></label>
        </div>
        <button type="button" className="button button--quiet" disabled={!key.trim() || !value.trim() || Boolean(document.language.labels[key.trim()])} onClick={() => { setLabel(key.trim(), value.trim()); setKey(""); setValue(""); }}>
          <Plus aria-hidden="true" /> Ajouter le libellé
        </button>
      </div>
      <figure className="surface-preview">
        <div className="surface-frame">
          <div className="surface-nav">
            <span><Compass aria-hidden="true" />{gameCopy(document, "nav.home", "Accueil")}</span>
            <span><BookOpen aria-hidden="true" />{gameCopy(document, "nav.library", "Bibliothèque")}</span>
            <span><Sparkles aria-hidden="true" />{gameCopy(document, "nav.experience", "Mon univers")}</span>
            <span><Settings2 aria-hidden="true" />{gameCopy(document, "nav.administration", "Administration")}</span>
          </div>
          <div className="surface-body">
            <p className="eyebrow">{gameCopy(document, "studio.copilot.eyebrow", "Copilote narratif")}</p>
            <strong>{gameCopy(document, "studio.copilot.title", "Du monde global au premier brouillon")}</strong>
          </div>
        </div>
        <figcaption>Aperçu de la navigation et du Studio avec les libellés configurés.</figcaption>
      </figure>
    </div>
  );
}
