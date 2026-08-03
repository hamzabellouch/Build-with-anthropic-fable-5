import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: false, linkify: true, breaks: false });
const esc = md.utils.escapeHtml;

/* ---------- wikilinks: [[Target]] / [[Target|Alias]] ---------- */
md.inline.ruler.before("link", "wikilink", (state: any, silent: boolean): boolean => {
  const src: string = state.src;
  const start: number = state.pos;
  if (src.charCodeAt(start) !== 0x5b /* [ */ || src.charCodeAt(start + 1) !== 0x5b) return false;
  const end = src.indexOf("]]", start + 2);
  if (end === -1) return false;
  const inner = src.slice(start + 2, end);
  if (!inner || inner.includes("[") || inner.includes("]") || inner.includes("\n")) return false;
  if (!silent) {
    const pipe = inner.indexOf("|");
    const target = (pipe === -1 ? inner : inner.slice(0, pipe)).trim();
    const display = pipe === -1 ? inner : inner.slice(pipe + 1);
    const token = state.push("wikilink", "", 0);
    token.content = display;
    token.meta = { target };
  }
  state.pos = end + 2;
  return true;
});

md.renderer.rules.wikilink = (tokens: any, idx: number, _opts: any, env: any) => {
  const token = tokens[idx];
  const target: string = token.meta?.target ?? token.content;
  const resolved = env?.isResolved ? !!env.isResolved(target) : true;
  return `<a class="internal-link${resolved ? "" : " is-unresolved"}" data-target="${esc(target)}">${esc(
    token.content
  )}</a>`;
};

/* ---------- task lists + per-block direction ---------- */
md.core.ruler.push("obsidian-extras", (state: any) => {
  const tokens = state.tokens;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    // dir="auto" on text blocks so RTL/LTR resolves per block
    if (
      t.type.endsWith("_open") &&
      ["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "table"].includes(t.tag)
    ) {
      t.attrSet("dir", "auto");
    }
    if (t.type === "heading_open" && t.map) {
      t.attrSet("data-line", String(t.map[0]));
    }

    // task list items: - [ ] / - [x]
    if (
      t.type === "inline" &&
      tokens[i - 1]?.type === "paragraph_open" &&
      tokens[i - 2]?.type === "list_item_open" &&
      /^\[([ xX])\] /.test(t.content)
    ) {
      const checked = /^\[[xX]\]/.test(t.content);
      const line = tokens[i - 2].map ? tokens[i - 2].map[0] : -1;
      const first = t.children?.[0];
      if (first && first.type === "text") {
        first.content = first.content.replace(/^\[([ xX])\] /, "");
        const box = new state.Token("html_inline", "", 0);
        box.content = `<input type="checkbox" class="task-checkbox" data-line="${line}"${
          checked ? " checked" : ""
        }>`;
        t.children.unshift(box);
        tokens[i - 2].attrJoin("class", "task-list-item" + (checked ? " task-done" : ""));
      }
    }
  }
});

/* ---------- external links open in a new tab ---------- */
md.renderer.rules.link_open = (tokens: any, idx: number, options: any, _env: any, self: any) => {
  const href = tokens[idx].attrGet("href") ?? "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noopener");
  }
  return self.renderToken(tokens, idx, options);
};

/* ---------- code blocks stay LTR ---------- */
const defaultFence =
  md.renderer.rules.fence ??
  ((tokens: any, idx: number, options: any, env: any, self: any) => self.renderToken(tokens, idx, options));
md.renderer.rules.fence = (tokens: any, idx: number, options: any, env: any, self: any) =>
  (defaultFence as any)(tokens, idx, options, env, self).replace("<pre", '<pre dir="ltr"');

export function renderMarkdown(src: string, isResolved: (target: string) => boolean): string {
  return md.render(src, { isResolved });
}
