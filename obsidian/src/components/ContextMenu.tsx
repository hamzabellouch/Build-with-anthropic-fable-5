import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Check } from "lucide-react";

export type MenuEntry =
  | {
      label: string;
      icon?: ReactNode;
      danger?: boolean;
      checked?: boolean;
      action: () => void;
    }
  | "sep";

interface MenuState {
  x: number;
  y: number;
  items: MenuEntry[];
}

let current: MenuState | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

export function openMenu(pos: { x: number; y: number }, items: MenuEntry[]) {
  current = { x: pos.x, y: pos.y, items };
  emit();
}
export function closeMenu() {
  if (current) {
    current = null;
    emit();
  }
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function MenuHost() {
  const menu = useSyncExternalStore(subscribe, () => current);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  // layout effect: measure + clamp BEFORE paint, so reopening the menu never
  // flashes one frame at the previous position
  useLayoutEffect(() => {
    if (!menu) {
      setPos(null);
      return;
    }
    // clamp into the viewport once rendered
    const el = ref.current;
    let x = menu.x;
    let y = menu.y;
    if (el) {
      const r = el.getBoundingClientRect();
      x = Math.min(x, window.innerWidth - r.width - 8);
      y = Math.min(y, window.innerHeight - r.height - 8);
    }
    setPos({ x: Math.max(4, x), y: Math.max(4, y) });

    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("mousedown", onDown, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", closeMenu);
    return () => {
      window.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", closeMenu);
    };
  }, [menu]);

  if (!menu) return null;
  return (
    <div
      className="menu"
      ref={ref}
      style={{ left: pos?.x ?? menu.x, top: pos?.y ?? menu.y, visibility: pos ? "visible" : "hidden" }}
    >
      {menu.items.map((item, i) =>
        item === "sep" ? (
          <div className="menu-sep" key={i} />
        ) : (
          <div
            className={"menu-item" + (item.danger ? " danger" : "")}
            key={i}
            onClick={() => {
              closeMenu();
              item.action();
            }}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.checked && <Check className="menu-check" size={15} />}
          </div>
        )
      )}
    </div>
  );
}
