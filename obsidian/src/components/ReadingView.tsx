import { useEffect, useMemo, useRef } from "react";
import { renderMarkdown } from "../markdown/render";
import { attachLinkHoverPreview } from "../editor/hoverPreview";
import { store, normalize } from "../store";

interface Props {
  fileId: string;
  content: string;
  namesVersion: number;
}

export function ReadingView({ fileId, content, namesVersion }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    void namesVersion;
    return renderMarkdown(content, (target) => !!store.resolveByName(target));
  }, [content, namesVersion]);

  // Obsidian-style page preview when hovering internal links
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return attachLinkHoverPreview(root, {
      getTarget: (el) => el.getAttribute("data-target"),
      resolve: (target) => {
        const f = store.resolveByName(target);
        return f ? { name: f.name, content: f.content ?? "" } : null;
      },
      openTarget: (target) => store.openWikilink(target, fileId),
    });
  }, [fileId]);

  // navigation when arriving via wikilink / outline / backlink — consumed
  // both at mount and live (same-file [[#heading]] clicks don't remount us;
  // unconsumed pendings would otherwise fire as surprise jumps much later)
  useEffect(() => {
    const apply = (p: { heading?: string; line?: number }) => {
      const root = ref.current;
      if (!root) return;
      if (p.heading) {
        const want = normalize(p.heading);
        for (const h of root.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
          if (normalize(h.textContent ?? "") === want) {
            h.scrollIntoView({ block: "start" });
            return;
          }
        }
      } else if (p.line != null) {
        // headings carry data-line; scroll to the nearest one at/before the line
        let best: Element | null = null;
        for (const el of root.querySelectorAll("[data-line]")) {
          const n = Number(el.getAttribute("data-line"));
          if (n <= p.line! && (!best || n > Number(best.getAttribute("data-line")))) best = el;
        }
        best?.scrollIntoView({ block: "start" });
      }
    };
    const atMount = store.consumePending(fileId);
    if (atMount) apply(atMount);
    const unsubscribe = store.subscribe(() => {
      if (store.pending?.fileId !== fileId) return;
      const p = store.consumePending(fileId);
      if (p) apply(p);
    });
    return () => {
      unsubscribe();
    };
  }, [fileId]);

  const onClick = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    const link = el.closest?.("a.internal-link");
    if (link) {
      e.preventDefault();
      const target = link.getAttribute("data-target");
      if (target) store.openWikilink(target, fileId);
      return;
    }
    if (el.matches?.("input.task-checkbox")) {
      const line = Number(el.getAttribute("data-line"));
      if (line >= 0) store.toggleTaskAtLine(fileId, line);
    }
  };

  return (
    <div className="markdown-reading" ref={ref} onClick={onClick}>
      <div className="reading-inner" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
