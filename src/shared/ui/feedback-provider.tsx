"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { randomId } from "@/shared/lib/random-id";

/**
 * Système unique de confirmation et de retour.
 *
 * Un seul composant porte les trois besoins qui étaient jusqu'ici traités par
 * trois mécanismes hétérogènes : `window.confirm` — impossible à styler, à
 * traduire ou à rendre accessible —, des messages en ligne propres à chaque
 * écran, et l'absence totale de retour de succès.
 *
 * Deux règles d'accessibilité tiennent ici, pas dans les appelants : le focus
 * est piégé dans la boîte de dialogue et rendu à son déclencheur, et Escape
 * annule toujours. Une action destructive prend `role="alertdialog"`, une
 * simple demande de confirmation `role="dialog"`.
 */

export type FeedbackTone = "success" | "error" | "info";

export interface ConfirmOptions {
  readonly title: string;
  readonly body?: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  /** Rend l'action irréversible explicite : `alertdialog` et bouton de danger. */
  readonly destructive?: boolean;
}

export interface Notice {
  readonly id: string;
  readonly tone: FeedbackTone;
  readonly message: string;
  readonly title?: string;
}

interface FeedbackApi {
  confirm(options: ConfirmOptions): Promise<boolean>;
  notify(notice: { tone: FeedbackTone; message: string; title?: string }): void;
  /** Raccourcis, parce que « succès » et « échec » sont 90 % des appels. */
  succeed(message: string): void;
  fail(message: string): void;
  dismiss(id: string): void;
}

const FeedbackContext = createContext<FeedbackApi | undefined>(undefined);

export function useFeedback(): FeedbackApi {
  const api = useContext(FeedbackContext);
  if (!api) throw new Error("useFeedback doit être appelé sous <FeedbackProvider>.");
  return api;
}

const noticeLifetimeMs = 6_000;

// `crypto.randomUUID` n'existe qu'en secure context, or ce client se déploie
// explicitement en HTTP sur des hôtes d'intranet. L'employer ici faisait lever
// `notify()` — appelé depuis tous les gestionnaires de succès *et* d'erreur,
// donc le moindre retour cassait l'écran.

interface PendingConfirm { options: ConfirmOptions }

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pending, setPending] = useState<PendingConfirm>();
  // La résolution vit dans une ref, pas dans l'état : un updater React doit
  // rester pur, et StrictMode l'invoque deux fois en développement.
  const resolvePending = useRef<((value: boolean) => void) | undefined>(undefined);

  const dismiss = useCallback((id: string) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);

  const notify = useCallback((notice: { tone: FeedbackTone; message: string; title?: string }) => {
    const id = randomId();
    setNotices((current) => [...current.slice(-3), { ...notice, id }]);
    // Une erreur reste affichée : elle demande une décision, pas un coup d'œil.
    if (notice.tone !== "error") {
      setTimeout(() => setNotices((current) => current.filter((item) => item.id !== id)), noticeLifetimeMs);
    }
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    // Une seconde demande remplace la première, mais ne l'abandonne pas : sans
    // cette résolution, l'appelant restait bloqué sur son `await` pour le reste
    // de la session — deux clics rapides sur deux boutons de suppression
    // suffisaient à figer le premier définitivement.
    resolvePending.current?.(false);
    resolvePending.current = resolve;
    setPending({ options });
  }), []);

  const api = useMemo<FeedbackApi>(() => ({
    confirm,
    notify,
    succeed: (message: string) => notify({ tone: "success", message }),
    fail: (message: string) => notify({ tone: "error", message }),
    dismiss,
  }), [confirm, dismiss, notify]);

  function settle(value: boolean) {
    const resolve = resolvePending.current;
    resolvePending.current = undefined;
    setPending(undefined);
    resolve?.(value);
  }

  return <FeedbackContext.Provider value={api}>
    {children}
    <NoticeRegion notices={notices} onDismiss={dismiss} />
    {pending && <ConfirmDialog options={pending.options} onSettle={settle} />}
  </FeedbackContext.Provider>;
}

const toneIcon = { success: CircleCheck, error: CircleAlert, info: Info } as const;
const toneLabel = { success: "Succès", error: "Erreur", info: "Information" } as const;

function NoticeRegion({ notices, onDismiss }: { notices: readonly Notice[]; onDismiss(id: string): void }) {
  return <div className="notice-region">
    {notices.map((notice) => {
      const Icon = toneIcon[notice.tone];
      return <div
        key={notice.id}
        className={`notice notice--${notice.tone}`}
        role={notice.tone === "error" ? "alert" : "status"}
      >
        <Icon aria-hidden="true" />
        <div>
          <strong>{notice.title ?? toneLabel[notice.tone]}</strong>
          <p>{notice.message}</p>
        </div>
        <button type="button" onClick={() => onDismiss(notice.id)} aria-label="Masquer ce message">
          <X aria-hidden="true" />
        </button>
      </div>;
    })}
  </div>;
}

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function ConfirmDialog({ options, onSettle }: { options: ConfirmOptions; onSettle(value: boolean): void }) {
  const panel = useRef<HTMLDivElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = "confirm-dialog-title";
  const bodyId = "confirm-dialog-body";

  useEffect(() => {
    opener.current = document.activeElement;
    confirmButton.current?.focus();
    const restore = opener.current;
    return () => { if (restore instanceof HTMLElement) restore.focus(); };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onSettle(false); return; }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = [...panel.current.querySelectorAll<HTMLElement>(focusableSelector)];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onSettle]);

  return <div className="confirm-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onSettle(false); }}>
    <div
      className={options.destructive ? "confirm-panel confirm-panel--destructive" : "confirm-panel"}
      role={options.destructive ? "alertdialog" : "dialog"}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={options.body ? bodyId : undefined}
      ref={panel}
    >
      <header>
        {options.destructive ? <TriangleAlert aria-hidden="true" /> : <Info aria-hidden="true" />}
        <h2 id={titleId}>{options.title}</h2>
      </header>
      {options.body && <p id={bodyId}>{options.body}</p>}
      <div className="confirm-actions">
        <button type="button" className="button button--quiet" onClick={() => onSettle(false)}>
          {options.cancelLabel ?? "Annuler"}
        </button>
        <button
          type="button"
          ref={confirmButton}
          className={options.destructive ? "button button--danger" : "button button--primary"}
          onClick={() => onSettle(true)}
        >
          {options.confirmLabel ?? "Confirmer"}
        </button>
      </div>
    </div>
  </div>;
}
