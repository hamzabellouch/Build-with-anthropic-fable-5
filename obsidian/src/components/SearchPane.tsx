import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Search } from "lucide-react";
import { store, useApp } from "../store";
import type { SearchMatch } from "../store";
import { focusEditorSoon } from "./actions";

function Highlighted({ m }: { m: SearchMatch }) {
  const relFrom = m.from - m.lineStart;
  const relTo = m.to - m.lineStart;
  const before = m.lineText.slice(Math.max(0, relFrom - 60), relFrom);
  const hit = m.lineText.slice(relFrom, relTo);
  const after = m.lineText.slice(relTo, relTo + 120);
  return (
    <span dir="auto">
      {before}
      <mark>{hit}</mark>
      {after}
    </span>
  );
}

export function SearchPane() {
  const state = useApp();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // the input stays controlled and instant; the vault scan waits for a pause
  useEffect(() => {
    if (query === debounced) return;
    const t = window.setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query, debounced]);

  const results = useMemo(
    () => store.search(debounced),
    // vaultVersion is the change counter — state.vault keeps its identity by design
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debounced, state.vaultVersion]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, SearchMatch[]>();
    for (const m of results) {
      const arr = map.get(m.fileId) ?? [];
      arr.push(m);
      map.set(m.fileId, arr);
    }
    return [...map.entries()];
  }, [results]);

  return (
    <>
      <div className="search-bar">
        <div className="search-input-wrap">
          <Search />
          <input
            ref={inputRef}
            className="obsidian-input"
            placeholder="Search..."
            value={query}
            dir="auto"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
                focusEditorSoon();
              }
            }}
            data-global-search
          />
        </div>
      </div>
      <div className="pane-scroll">
        {debounced && (
          <div className="search-info">
            {results.length === 0
              ? "No results found."
              : `${results.length} result${results.length === 1 ? "" : "s"} in ${grouped.length} file${
                  grouped.length === 1 ? "" : "s"
                }.`}
          </div>
        )}
        {grouped.map(([fileId, matches]) => {
          const file = store.node(fileId);
          if (!file) return null;
          return (
            <div key={fileId}>
              <div className="search-file" onClick={() => store.openFile(fileId)}>
                <FileText />
                <span className="tree-name" dir="auto">{file.name}</span>
              </div>
              {matches.map((m, i) => (
                <div
                  key={i}
                  className="search-match"
                  onClick={() =>
                    store.openFile(fileId, { pending: { selFrom: m.from, selTo: m.to } })
                  }
                >
                  <Highlighted m={m} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
