import { renderMarkdown } from "../markdown/render";

const HOVER_DELAY_MS = 400;
const PREVIEW_CHARS = 1500;

export interface HoverPreviewOptions {
  /** Extract the wikilink target from a hovered `[data-target]` element. */
  getTarget(el: Element): string | null;
  /** Resolve a target to a note; return null for unresolved links (no card shown). */
  resolve(target: string): { name: string; content: string } | null;
  /** Optional: invoked when the user clicks inside the preview card. */
  openTarget?(target: string): void;
}

/**
 * Obsidian-style page preview on link hover.
 *
 * Attaches delegated mouseover/mouseout listeners to `root` and, after a
 * short hover (~400ms) over any element carrying `[data-target]`, shows a
 * floating `.hover-preview` card (appended to document.body, dir="auto")
 * with the note title and the first ~1500 chars rendered as markdown,
 * clamped to the viewport near the link.
 *
 * The card is disposed on mouseleave (of link and card), any scroll, any
 * mousedown, and by the returned cleanup function.
 *
 * Usage (works for the CM editor DOM and for ReadingView alike — the only
 * requirement is internal links exposing `data-target`):
 *
 *   const detach = attachLinkHoverPreview(rootEl, {
 *     getTarget: (el) => el.getAttribute("data-target"),
 *     resolve: (target) => {
 *       const f = store.resolveByName(target);
 *       return f ? { name: f.name, content: f.content ?? "" } : null;
 *     },
 *     openTarget: (target) => store.openWikilink(target, fileId),
 *   });
 *   // later: detach();
 */
export function attachLinkHoverPreview(root: HTMLElement, opts: HoverPreviewOptions): () => void {
  let timer: number | undefined;
  let hideTimer: number | undefined;
  let anchor: Element | null = null;
  let card: HTMLDivElement | null = null;
  let currentTarget: string | null = null;

  const cancelTimer = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
  const cancelHide = () => {
    if (hideTimer !== undefined) {
      clearTimeout(hideTimer);
      hideTimer = undefined;
    }
  };

  const hide = () => {
    cancelTimer();
    cancelHide();
    if (card) {
      card.remove();
      card = null;
    }
    currentTarget = null;
  };

  // grace period so the pointer can cross the gap between link and card
  const scheduleHide = () => {
    cancelHide();
    hideTimer = window.setTimeout(() => {
      hideTimer = undefined;
      anchor = null;
      hide();
    }, 130);
  };

  const show = (el: Element) => {
    timer = undefined;
    if (!el.isConnected) return; // decorations may have been rebuilt under us
    const target = opts.getTarget(el);
    if (!target) return;
    const resolved = opts.resolve(target);
    if (!resolved) return;

    currentTarget = target;
    card = document.createElement("div");
    card.className = "hover-preview";
    card.dir = "auto";

    const title = document.createElement("div");
    title.className = "hover-preview-title";
    title.dir = "auto";
    title.textContent = resolved.name;
    card.appendChild(title);

    const body = document.createElement("div");
    body.className = "hover-preview-content";
    body.dir = "auto";
    if (resolved.content.trim()) {
      const truncated = resolved.content.length > PREVIEW_CHARS;
      const text = truncated ? resolved.content.slice(0, PREVIEW_CHARS) : resolved.content;
      body.innerHTML =
        renderMarkdown(text, (t) => opts.resolve(t) != null) +
        (truncated ? '<div class="hover-preview-more">…</div>' : "");
    } else {
      body.innerHTML = '<div class="hover-preview-empty">This note is empty.</div>';
    }
    card.appendChild(body);

    // keep the card open while the pointer is over it (Obsidian behavior)
    card.addEventListener("mouseenter", cancelHide);
    card.addEventListener("mouseleave", (e) => {
      const to = e.relatedTarget as Node | null;
      if (to && anchor && anchor.contains(to)) return;
      scheduleHide();
    });

    // measure offscreen, then clamp near the link within the viewport
    card.style.left = "-9999px";
    card.style.top = "0px";
    document.body.appendChild(card);
    const rect = el.getBoundingClientRect();
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(8, rect.left), Math.max(8, vw - cw - 8));
    let top = rect.bottom + 8;
    if (top + ch > vh - 8) top = rect.top - ch - 8;
    if (top < 8) top = Math.max(8, vh - ch - 8);
    card.style.left = left + "px";
    card.style.top = top + "px";
  };

  const onOver = (e: MouseEvent) => {
    const el = (e.target as Element | null)?.closest?.("[data-target]");
    if (!el || !root.contains(el)) return;
    if (el === anchor) {
      cancelHide(); // back onto the anchor within the grace period
      return;
    }
    cancelTimer();
    hide();
    anchor = el;
    timer = window.setTimeout(() => show(el), HOVER_DELAY_MS);
  };

  const onOut = (e: MouseEvent) => {
    if (!anchor) return;
    const to = e.relatedTarget as Node | null;
    if (to && (anchor.contains(to) || (card && card.contains(to)))) return;
    if (card) {
      scheduleHide(); // give the pointer time to reach the card
    } else {
      anchor = null;
      hide();
    }
  };

  const onScroll = () => hide();

  const onMouseDown = (e: MouseEvent) => {
    if (card && currentTarget && opts.openTarget && card.contains(e.target as Node)) {
      e.preventDefault();
      const target = currentTarget;
      hide();
      opts.openTarget(target);
      return;
    }
    hide();
  };

  root.addEventListener("mouseover", onOver);
  root.addEventListener("mouseout", onOut);
  window.addEventListener("scroll", onScroll, true);
  document.addEventListener("mousedown", onMouseDown, true);

  return () => {
    hide();
    anchor = null;
    root.removeEventListener("mouseover", onOver);
    root.removeEventListener("mouseout", onOut);
    window.removeEventListener("scroll", onScroll, true);
    document.removeEventListener("mousedown", onMouseDown, true);
  };
}
