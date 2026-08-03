"""خطّاط command line.

    khattat "العِلْمُ نُورٌ"                        # quickest form
    khattat render "نَصٌّ مُشَكَّلٌ" --preset manuscript -o out.mp4
    khattat demo --preset chalkboard
    khattat gallery
    khattat fonts list | fetch
    khattat presets
    khattat doctor
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import __version__
from . import fonts as fontlib
from .style import (INKS, PRESET_BLURBS, PRESETS, RenderConfig, apply_preset)

DEMO_SENTENCES = [
    ("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "the Basmala"),
    ("العِلْمُ نُورٌ وَالجَهْلُ ظَلَامٌ", "knowledge is light, ignorance darkness"),
    ("مَنْ جَدَّ وَجَدَ وَمَنْ زَرَعَ حَصَدَ", "who strives finds; who sows reaps"),
    ("الصَّبْرُ مِفْتَاحُ الفَرَجِ", "patience is the key to relief"),
    ("اُطْلُبُوا العِلْمَ مِنَ المَهْدِ إِلَى اللَّحْدِ", "seek knowledge, cradle to grave"),
    ("خَيْرُ الكَلَامِ مَا قَلَّ وَدَلَّ", "the best speech is brief and clear"),
]

GALLERY = [
    ("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "manuscript", "manuscript.mp4",
     {"duration": 17.0}),
    ("العِلْمُ نُورٌ وَالجَهْلُ ظَلَامٌ", "chalkboard", "chalkboard.mp4",
     {"duration": 15.0}),
    ("مَنْ جَدَّ وَجَدَ", "golden", "golden.mp4", {"duration": 11.0}),
    ("الصَّبْرُ مِفْتَاحُ الفَرَجِ", "neon", "neon.mp4", {"duration": 12.0}),
    ("خَيْرُ الكَلَامِ مَا قَلَّ وَدَلَّ", "typewriter", "typewriter.mp4", {}),
    ("اُطْلُبُوا العِلْمَ مِنَ المَهْدِ إِلَى اللَّحْدِ", "reel", "reel.mp4",
     {"duration": 15.0, "size": (720, 1280)}),
]


def _add_render_args(p: argparse.ArgumentParser):
    B = argparse.BooleanOptionalAction
    p.add_argument("text", nargs="*", help="the sentence(s) to write; '-' reads stdin")
    p.add_argument("-f", "--file", help="read text from a UTF-8 file")
    p.add_argument("-o", "--out", help="output path (.mp4 .webm .gif .png or a dir for frames)")
    p.add_argument("--to", dest="fmt", choices=["mp4", "webm", "gif", "png", "frames"],
                   help="force output format regardless of extension")
    p.add_argument("--preset", choices=sorted(PRESETS), help="style bundle (see `khattat presets`)")
    p.add_argument("--font", help="font name, family fragment, or .ttf path")
    p.add_argument("--size", help="WxH, e.g. 1280x720 — or 'reel' (1080x1920), 'square' (1080x1080), '4k'")
    p.add_argument("--fps", type=int, help="frames per second (default 30)")
    p.add_argument("--font-size", type=int, help="letter size in output px (default: auto-fit)")
    p.add_argument("--align", choices=["center", "right", "left"])
    p.add_argument("--margin", type=float, help="margin as a fraction of the short side (default 0.08)")
    p.add_argument("--order", choices=["word", "glyph", "line"],
                   help="writing discipline: word = rasm→dots→tashkil per word (default)")
    p.add_argument("--mode", choices=["write", "typewriter"])
    p.add_argument("--speed", type=float, help="hand speed multiplier (default 1.0)")
    p.add_argument("--duration", type=float, help="fit the writing into N seconds")
    p.add_argument("--hold", type=float, help="seconds to hold the finished page (default 1.8)")
    p.add_argument("--pen", choices=["qalam", "fountain", "pencil", "chalk", "brush", "none"])
    p.add_argument("--ink", help=f"ink style ({', '.join(INKS)}) or any #hex / r,g,b")
    p.add_argument("--paper", help="cream, white, parchment, lined, blackboard, dark, midnight, none, or #hex")
    p.add_argument("--guidelines", action=B, help="faint dotted baselines")
    p.add_argument("--flourish", action=B, help="closing swash under the text")
    p.add_argument("--karaoke", nargs="?", const="amber",
                   help="highlight the word being written (optional color)")
    p.add_argument("--camera", choices=["static", "follow"])
    p.add_argument("--zoom", type=float, help="follow-camera zoom (default 1.55)")
    p.add_argument("--audio", action=B, help="synthesized pen sound (default on)")
    p.add_argument("--volume", type=float, help="audio gain 0..2")
    p.add_argument("--seed", type=int, help="random seed (default 7)")
    p.add_argument("--digits", choices=["keep", "arabic", "western"],
                   help="convert digits (٠١٢ ↔ 012)")
    p.add_argument("--wrap", action=B, help="auto line wrapping (default on)")
    p.add_argument("--srt", action=B, help="write word-timed subtitles next to the video")
    p.add_argument("--timeline", action=B, help="write a timeline .json next to the video")
    p.add_argument("--crf", type=int, help="x264 quality, lower = better (default 18)")
    p.add_argument("--supersample", type=int, choices=[1, 2, 3], help="render scale (default 2)")
    p.add_argument("--particles", choices=["auto", "on", "off"], help="chalk dust")
    p.add_argument("--title", help="small caption at the bottom of the page")
    p.add_argument("--show-pen", action=B, help="draw the pen (default on)")
    p.add_argument("--quiet", action="store_true")

SIZE_ALIASES = {
    "reel": (1080, 1920), "story": (1080, 1920), "square": (1080, 1080),
    "hd": (1280, 720), "fullhd": (1920, 1080), "1080p": (1920, 1080),
    "4k": (3840, 2160), "banner": (1920, 600),
}


def _parse_size(s: str):
    s = s.strip().lower()
    if s in SIZE_ALIASES:
        return SIZE_ALIASES[s]
    for sep in ("x", "×", ","):
        if sep in s:
            a, b = s.split(sep, 1)
            return (int(a), int(b))
    raise argparse.ArgumentTypeError(f"cannot parse size '{s}'")


def _gather_text(args) -> str:
    if args.file:
        return Path(args.file).read_text(encoding="utf-8").strip()
    if args.text == ["-"] or (not args.text and not sys.stdin.isatty()):
        return sys.stdin.read().strip()
    if args.text:
        return " ".join(args.text).replace("\\n", "\n")
    raise SystemExit("no text given — pass it as an argument, via --file, or on stdin")


def _build_config(args) -> RenderConfig:
    cfg = RenderConfig()
    if args.preset:
        cfg = apply_preset(cfg, args.preset)
    direct = {
        "out": args.out, "font": args.font, "fps": args.fps,
        "font_size": args.font_size, "align": args.align, "margin": args.margin,
        "order": args.order, "mode": args.mode, "speed": args.speed,
        "duration": args.duration, "hold": args.hold, "pen": args.pen,
        "ink": args.ink, "paper": args.paper, "guidelines": args.guidelines,
        "flourish": args.flourish, "karaoke": args.karaoke,
        "camera": args.camera, "zoom": args.zoom, "audio": args.audio,
        "volume": args.volume, "seed": args.seed, "digits": args.digits,
        "wrap": args.wrap, "srt": args.srt, "timeline": args.timeline,
        "fmt": args.fmt, "crf": args.crf, "supersample": args.supersample,
        "particles": args.particles, "title": args.title,
        "show_pen": args.show_pen,
    }
    for k, v in direct.items():
        if v is not None:
            setattr(cfg, k, v)
    if args.size:
        cfg.size = _parse_size(args.size)
    cfg.text = _gather_text(args)
    if args.out is None and not PRESETS.get(args.preset or "", {}).get("out"):
        ext = ".webm" if cfg.paper in ("none", "transparent", "alpha") else ".mp4"
        cfg.out = "khattat" + ext
    return cfg


def cmd_render(args):
    from .pipeline import render
    cfg = _build_config(args)
    render(cfg, quiet=args.quiet)


def cmd_demo(args):
    from .pipeline import render
    idx = (args.n - 1) % len(DEMO_SENTENCES)
    text, gloss = DEMO_SENTENCES[idx]
    args.text = [text]
    cfg = _build_config(args)
    if not args.out:
        cfg.out = f"demo_{args.preset or 'classic'}.mp4"
    print(f"✼ text     {text}  — {gloss}", file=sys.stderr)
    render(cfg, quiet=args.quiet)


def cmd_gallery(args):
    from .pipeline import render
    outdir = Path(args.out or "demos")
    outdir.mkdir(parents=True, exist_ok=True)
    for i, (text, preset, name, extra) in enumerate(GALLERY, 1):
        cfg = apply_preset(RenderConfig(), preset)
        cfg.text, cfg.out = text, str(outdir / name)
        for k, v in extra.items():
            setattr(cfg, k, v)
        print(f"\n— [{i}/{len(GALLERY)}] {preset}: {text}", file=sys.stderr)
        render(cfg, quiet=False)
    print(f"\n✼ gallery complete → {outdir}/", file=sys.stderr)


def cmd_fonts(args):
    if args.action == "fetch":
        got = fontlib.fetch(args.names or None)
        print(f"✼ {len(got)} font(s) ready")
        return
    have = fontlib.installed()
    print("bundled fonts (✓ = downloaded):")
    for name, (filename, _url, style, blurb) in fontlib.REGISTRY.items():
        mark = "✓" if name in have else "·"
        print(f"  {mark} {name:<12} {style:<9} {blurb}")
    sys_fonts = fontlib.system_arabic_fonts()
    if sys_fonts:
        print("\nsystem fonts with Arabic coverage (usable via --font \"name\"):")
        for fam, _p in sys_fonts[:14]:
            print(f"    {fam}")
    print("\nfetch with:  khattat fonts fetch [names…]")


def cmd_presets(_args):
    print("presets (khattat render … --preset NAME):")
    for name in PRESETS:
        print(f"  {name:<12} {PRESET_BLURBS.get(name, '')}")


def cmd_doctor(_args):
    import importlib
    print(f"khattat {__version__} on python {sys.version.split()[0]}")
    for mod in ("numpy", "PIL", "uharfbuzz", "freetype", "scipy"):
        try:
            m = importlib.import_module(mod)
            v = getattr(m, "__version__", None) or getattr(m, "version", "?")
            if callable(v):
                v = ".".join(str(x) for x in v())
            print(f"  ✓ {mod:<10} {v}")
        except Exception as e:  # noqa: BLE001
            print(f"  ✗ {mod:<10} {e}")
    from .media import have_ffmpeg
    print(f"  {'✓' if have_ffmpeg() else '✗'} ffmpeg     "
          f"{'found' if have_ffmpeg() else 'missing — only gif/frames/png output will work'}")
    have = fontlib.installed()
    print(f"  {'✓' if have else '✗'} fonts      {len(have)} bundled font(s) present"
          + ("" if have else " — run `khattat fonts fetch`"))
    try:
        import PIL.features
        print(f"  {'✓' if PIL.features.check('raqm') else '·'} raqm       "
              "(only used for --title captions)")
    except Exception:
        pass


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    sub = {"render", "demo", "gallery", "fonts", "presets", "doctor"}
    if argv and argv[0] not in sub | {"-h", "--help", "--version"}:
        argv.insert(0, "render")

    ap = argparse.ArgumentParser(
        prog="khattat",
        description="خطّاط — a virtual calligrapher that writes Arabic by hand: "
                    "rasm first, back for the dots, tashkil last.",
        epilog="quick start:  khattat \"العِلْمُ نُورٌ\" --preset manuscript")
    ap.add_argument("--version", action="version", version=f"khattat {__version__}")
    sp = ap.add_subparsers(dest="cmd", required=True)

    p = sp.add_parser("render", help="render text to a video")
    _add_render_args(p)
    p.set_defaults(fn=cmd_render)

    p = sp.add_parser("demo", help="render a built-in vocalized sentence")
    _add_render_args(p)
    p.add_argument("-n", type=int, default=1,
                   help=f"which sentence (1..{len(DEMO_SENTENCES)})")
    p.set_defaults(fn=cmd_demo)

    p = sp.add_parser("gallery", help="render the full showcase into ./demos")
    p.add_argument("--out", help="output directory (default ./demos)")
    p.set_defaults(fn=cmd_gallery)

    p = sp.add_parser("fonts", help="list or fetch bundled fonts")
    p.add_argument("action", nargs="?", choices=["list", "fetch"], default="list")
    p.add_argument("names", nargs="*", help="specific fonts to fetch")
    p.set_defaults(fn=cmd_fonts)

    p = sp.add_parser("presets", help="list style presets")
    p.set_defaults(fn=cmd_presets)

    p = sp.add_parser("doctor", help="check the environment")
    p.set_defaults(fn=cmd_doctor)

    args = ap.parse_args(argv)
    try:
        args.fn(args)
    except KeyboardInterrupt:
        print("\ninterrupted", file=sys.stderr)
        return 130
    except (ValueError, FileNotFoundError, RuntimeError, KeyError) as e:
        print(f"khattat: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
