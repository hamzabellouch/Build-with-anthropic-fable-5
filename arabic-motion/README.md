# خَطَّاط · Khattat

**Turn any Arabic sentence into a video of a calligrapher writing it by hand.**

Khattat doesn't fake handwriting with a sliding wipe. It studies the actual
letterforms of the font you choose, extracts their skeletons, and moves a pen
along them the way a trained hand would — it writes each word's connected body
(الرَّسْم) in one flowing motion, lifts the pen, comes **back for the dots**,
then places the **tashkil** — fatha, damma, kasra, shadda — as quick finishing
strokes. Fresh ink glistens dark and dries before your eyes. The nib scratches.
The dots land with soft taps. It is, in short, a tiny virtual خطّاط.

```
pip install -e .          # from this repo
khattat fonts fetch       # grab the bundled OFL fonts (already done if you cloned with fonts/)
khattat "العِلْمُ نُورٌ وَالجَهْلُ ظَلَامٌ" --preset manuscript
```

That's it — `khattat.mp4` appears, complete with synthesized pen sound.

---

## What it does

| | |
|---|---|
| ✍️ **True stroke simulation** | per-glyph skeletons + a graph walk that enters top-right and flows down/left, like a real hand (not a left-to-right reveal) |
| 🔠 **The calligrapher's discipline** | rasm first → back for the i'jam dots → tashkil last; choose `--order word` (default), `glyph`, or `line` |
| 🖋️ **Five pens** | `qalam` (reed), `fountain`, `pencil`, `chalk`, `brush` — all drawn procedurally, each with its own sound |
| 📜 **Seven papers** | `cream`, `white`, `parchment`, `lined`, `blackboard`, `dark`, `midnight`, any `#hex`, or `none` (transparent) |
| 🎨 **Eleven inks** | `black`, `sepia`, `blue`, `crimson`, `emerald`, `gold` (gradient + edge shading + sparkle), `neon` (real glow), `chalk`, `graphite`, … or any `#hex` |
| 💧 **Wet ink** | fresh strokes render darker and dry over ~a second |
| 🔊 **Synthesized audio** | nib friction follows pen velocity, dots tap, stereo pans with the pen; typewriter mode gets clack-clack-ding |
| 🎥 **Follow camera** | `--camera follow` tracks the nib up close, then eases out to reveal the page |
| 📱 **Social sizes** | `--size reel` (1080×1920), `square`, `4k`, or any `WxH` |
| 🪶 **Flourish** | `--flourish` closes with a tapered swash under the text |
| 🟡 **Karaoke mode** | `--karaoke` paints the word being written in a highlight color until it's done — pairs with `--srt` |
| 📝 **Word-timed SRT** | `--srt` writes subtitles cued to when each word is written |
| ⌨️ **Typewriter mode** | `--mode typewriter`: letters stamp with mechanical clacks, dead-key harakat, and a line-feed *ding* |
| 🫥 **Transparent overlays** | `--paper none -o out.webm` → VP9 with a real alpha channel for video editors |
| 🌫️ **Chalk dust** | falling particles when the chalk writes (chalkboard preset) |
| 🔢 **Mixed direction** | digits and Latin fragments inside Arabic sentences lay out correctly |
| 🎲 **Deterministic** | same `--seed` → identical video, bit for bit |

## Presets

```
khattat presets
```

| preset | look |
|---|---|
| `classic` | cream paper, reed qalam, black ink — timeless naskh |
| `manuscript` | aged parchment, sepia ink, closing flourish |
| `golden` | gold-leaf lettering on parchment, bold Amiri |
| `mashq` | ruled practice sheet, blue fountain pen, letter by letter |
| `chalkboard` | a teacher's hand on a dusty blackboard, falling chalk |
| `neon` | glowing tubes on a midnight wall (Reem Kufi) |
| `reel` | 1080×1920 vertical with follow-cam, made for shorts |
| `diwan` | Nastaliq poetry (Gulzar) with a sweeping flourish |
| `typewriter` | mechanical stamping, clacks and dings |
| `ghost` | transparent WebM overlay, no pen — drop onto your own footage |
| `karaoke` | active word glows amber, writes an `.srt` beside the video |

Any flag overrides its preset: `--preset neon --ink neon-pink --font cairo`.

## A few recipes

```bash
# the Basmala on parchment, gold ink, with a flourish — fit into 15 seconds
khattat "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" --preset golden --duration 15 -o basmala.mp4

# vertical reel: follow the nib, hold the final page 2.5 s
khattat "مَنْ جَدَّ وَجَدَ" --size reel --camera follow --paper dark --ink white --hold 2.5

# a teaching clip: letter-by-letter on a blackboard, slower, with subtitles
khattat "اُطْلُبُوا العِلْمَ" --preset chalkboard --order glyph --speed 0.7 --srt

# two-line poetry in Nastaliq (use \n for a line break)
khattat 'أَلَا لَيْتَ الشَّبَابَ يَعُودُ يَوْمًا\nفَأُخْبِرَهُ بِمَا فَعَلَ المَشِيبُ' --preset diwan

# transparent overlay for your video editor (real alpha)
khattat "أَهْلًا وَسَهْلًا" --preset ghost -o welcome.webm

# crisp still of the finished calligraphy (PNG, fast — no animation)
khattat "الحَمْدُ لِلَّهِ" --to png --paper parchment --ink gold -o hamd.png

# a GIF for the group chat
khattat "صَبَاحُ الخَيْرِ" --to gif --size 480x270 --speed 1.5 -o sabah.gif

# from a file / stdin, timeline JSON for editors
khattat render -f poem.txt --timeline
echo "سَلَامٌ" | khattat -
```

Try `khattat demo -n 3 --preset chalkboard`, or render the whole showcase:

```bash
khattat gallery        # → demos/*.mp4
```

## Fonts

Ten OFL-licensed faces are bundled (fetched into `fonts/`):

`amiri` · `amiri-bold` · `scheherazade` · `lateef` · `noto-naskh` (naskh)
· `ruqaa` (ruq'ah) · `gulzar` (nastaliq) · `reem-kufi` (kufi) · `cairo` · `tajawal` (sans)

`khattat fonts list` also shows every Arabic-capable font already on your
system — use any of them, or point `--font` at a `.ttf`/`.otf` file. Fonts with
rich mark positioning (Amiri, Scheherazade) give the most beautiful tashkil.

## How it works

```
text ──HarfBuzz──▶ positioned glyphs (marks identified by cluster)
     ──FreeType──▶ per-word ink bitmap ──labeling──▶ rasm bodies · dots · marks
     ──Zhang-Suen thinning──▶ skeletons ──graph walk──▶ ordered pen strokes
     ──scheduler──▶ curvature-aware timing, travels, hesitations, pauses
     ──compositor──▶ wet-ink reveal + procedural paper + procedural pen
     ──ffmpeg◀──── frames + synthesized stereo audio ──▶ mp4 / webm / gif
```

The trick that makes it look *written* rather than *revealed*: each connected
component of a word is thinned to its skeleton, the skeleton becomes a graph,
and a walker assembles pen strokes preferring to start top-right and keep
moving — straight through junctions — downward and leftward. Local stroke
thickness comes from the distance transform, so the ink disk that follows the
pen exactly refills the original letterform. Nothing is ever drawn that the
font didn't draw first.

## Python API

```python
import khattat

khattat.render_text(
    "العِلْمُ نُورٌ",
    out="ilm.mp4",
    preset="manuscript",
    duration=12,
    srt=True,
)
```

Everything the CLI can do is a keyword (`see khattat.RenderConfig`).

## Requirements

- Python ≥ 3.10 with `numpy`, `pillow`, `uharfbuzz`, `freetype-py`, `scipy`
  (all wheel-installable, no system libs needed)
- `ffmpeg` on PATH for mp4/webm/gif — without it you can still render
  `--to frames` and `--to png`
- no GPU, no ML, no internet (after fonts are fetched), no assets — every
  paper, pen, and sound is generated from code

## Troubleshooting

- **“font … not downloaded”** → `khattat fonts fetch`
- **“ffmpeg not found”** → install ffmpeg, or use `--to frames` / `--to png`
- **Text overflows / too small** → give it more room (`--size fullhd`),
  shrink margins (`--margin 0.05`), or set `--font-size`
- **Renders feel slow** → `--supersample 1` for drafts, smaller `--size`,
  `--fps 24`; the default `--supersample 2` is for final quality
- **Tashkil sit high above the letters** → that's the font's classical mark
  placement (Amiri does this by design); try `--font scheherazade` for tighter
  marks

## License

Code: MIT. Bundled fonts: SIL Open Font License (each from Google Fonts;
see their upstream repositories for full texts).

---

*اللُّغَةُ العَرَبِيَّةُ تَسْتَحِقُّ أَنْ تُكْتَبَ بِأَنَاقَة.*
