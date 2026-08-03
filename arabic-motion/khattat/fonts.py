"""Font registry: bundled OFL fonts, system fonts, fetching, resolution."""
from __future__ import annotations

import os
import subprocess
import sys
import urllib.request
from pathlib import Path

PKG_ROOT = Path(__file__).resolve().parent.parent
FONT_DIRS = [
    PKG_ROOT / "fonts",
    Path.home() / ".local" / "share" / "khattat" / "fonts",
]

GF_RAW = "https://raw.githubusercontent.com/google/fonts/main/ofl"

# name -> (filename, url-path, style, blurb)
REGISTRY = {
    "amiri": ("Amiri-Regular.ttf", f"{GF_RAW}/amiri/Amiri-Regular.ttf",
              "naskh", "classical Naskh, superb tashkil — the default"),
    "amiri-bold": ("Amiri-Bold.ttf", f"{GF_RAW}/amiri/Amiri-Bold.ttf",
                   "naskh", "Amiri with a heavier, juicier stroke"),
    "scheherazade": ("ScheherazadeNew-Regular.ttf",
                     f"{GF_RAW}/scheherazadenew/ScheherazadeNew-Regular.ttf",
                     "naskh", "airy traditional Naskh by SIL"),
    "ruqaa": ("ArefRuqaa-Regular.ttf", f"{GF_RAW}/arefruqaa/ArefRuqaa-Regular.ttf",
              "ruqaa", "Ruq'ah — the everyday handwriting of the Levant"),
    "lateef": ("Lateef-Regular.ttf", f"{GF_RAW}/lateef/Lateef-Regular.ttf",
               "naskh", "extended Naskh tuned for readability"),
    "gulzar": ("Gulzar-Regular.ttf", f"{GF_RAW}/gulzar/Gulzar-Regular.ttf",
               "nastaliq", "flowing Nastaliq — poetry in motion"),
    "reem-kufi": ("ReemKufi[wght].ttf", f"{GF_RAW}/reemkufi/ReemKufi%5Bwght%5D.ttf",
                  "kufi", "geometric modern Kufi (display, light tashkil)"),
    "noto-naskh": ("NotoNaskhArabic[wght].ttf",
                   f"{GF_RAW}/notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf",
                   "naskh", "Google's workhorse Naskh"),
    "cairo": ("Cairo[slnt,wght].ttf", f"{GF_RAW}/cairo/Cairo%5Bslnt,wght%5D.ttf",
              "sans", "contemporary low-contrast Kufi/sans"),
    "tajawal": ("Tajawal-Regular.ttf", f"{GF_RAW}/tajawal/Tajawal-Regular.ttf",
                "sans", "clean geometric sans"),
}

ALIASES = {
    "default": "amiri", "naskh": "amiri", "nastaliq": "gulzar",
    "kufi": "reem-kufi", "ruqah": "ruqaa", "ruqa": "ruqaa",
    "scheherazade-new": "scheherazade", "noto": "noto-naskh",
}


def _find_file(filename: str) -> Path | None:
    for d in FONT_DIRS:
        p = d / filename
        if p.is_file():
            return p
    return None


def installed() -> dict[str, Path]:
    """name -> path for every registry font present on disk."""
    out = {}
    for name, (filename, *_rest) in REGISTRY.items():
        p = _find_file(filename)
        if p:
            out[name] = p
    return out


def system_arabic_fonts() -> list[tuple[str, Path]]:
    """Arabic-capable fonts found through fontconfig, as (family, path)."""
    try:
        res = subprocess.run(
            ["fc-list", ":lang=ar", "file", "family"],
            capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.TimeoutExpired):
        return []
    found = []
    for line in res.stdout.splitlines():
        if ":" not in line:
            continue
        path, _, fam = line.partition(":")
        path = path.strip()
        fam = fam.strip().lstrip(":").strip().split(",")[0]
        if path.lower().endswith((".ttf", ".otf")) and fam:
            found.append((fam, Path(path)))
    seen, uniq = set(), []
    for fam, p in sorted(found):
        if fam not in seen:
            seen.add(fam)
            uniq.append((fam, p))
    return uniq


def fetch(names=None, quiet=False) -> list[str]:
    """Download registry fonts into the user font dir. Returns fetched names."""
    target = FONT_DIRS[0] if os.access(FONT_DIRS[0].parent, os.W_OK) else FONT_DIRS[1]
    target.mkdir(parents=True, exist_ok=True)
    todo = names or list(REGISTRY)
    got = []
    for name in todo:
        name = ALIASES.get(name, name)
        if name not in REGISTRY:
            print(f"  ? unknown font '{name}' — see `khattat fonts list`", file=sys.stderr)
            continue
        filename, url, *_ = REGISTRY[name]
        if _find_file(filename):
            got.append(name)
            continue
        dest = target / filename
        try:
            if not quiet:
                print(f"  ↓ {name:<14} {url.rsplit('/', 1)[-1]}")
            with urllib.request.urlopen(url, timeout=30) as r:
                data = r.read()
            if data[:4] not in (b"\x00\x01\x00\x00", b"OTTO", b"true"):
                raise ValueError("not a TTF/OTF file")
            dest.write_bytes(data)
            got.append(name)
        except Exception as e:  # noqa: BLE001
            print(f"  ✗ {name}: {e}", file=sys.stderr)
    return got


def resolve(spec: str | None) -> Path:
    """Turn a font spec (registry name, family fragment, or path) into a file."""
    spec = (spec or "amiri").strip()
    p = Path(os.path.expanduser(spec))
    if p.suffix.lower() in (".ttf", ".otf") or p.is_file():
        if p.is_file():
            return p
        raise FileNotFoundError(f"font file not found: {p}")

    key = ALIASES.get(spec.lower(), spec.lower())
    if key in REGISTRY:
        found = _find_file(REGISTRY[key][0])
        if found:
            return found
        fetched = fetch([key], quiet=True)
        if fetched:
            return _find_file(REGISTRY[key][0])
        raise FileNotFoundError(
            f"font '{spec}' is known but not downloaded and fetching failed.\n"
            f"Run:  khattat fonts fetch")

    # fuzzy: substring of a registry key
    for name in REGISTRY:
        if key in name:
            return resolve(name)
    # fall back to system fonts
    for fam, path in system_arabic_fonts():
        if key in fam.lower():
            return path
    raise FileNotFoundError(
        f"no font matches '{spec}'. Try `khattat fonts list` or pass a .ttf path.")
