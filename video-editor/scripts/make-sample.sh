#!/usr/bin/env bash
# Generates samples/sample.mp4 — a 75s synthetic "talking head" video used to
# exercise the pipeline without real footage:
#   video: 0-25s busy motion (testsrc2), 25-50s static slide, 50-75s static bars
#          (two long visually-stale stretches → concept graphic candidates)
#   audio: pink-noise "speech" bursts separated by silences → silence cuts
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p samples
out="samples/sample.mp4"

# silence windows: 6-8.5, 20-21.6, 34-37, 52-53.4, 70-75
ffmpeg -y -v error \
  -f lavfi -i "testsrc2=size=1280x720:rate=30:duration=25" \
  -f lavfi -i "color=c=0x16324f:size=1280x720:rate=30:duration=25" \
  -f lavfi -i "smptehdbars=size=1280x720:rate=30:duration=25" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=44100:duration=75:amplitude=0.28" \
  -filter_complex "\
[0:v][1:v][2:v]concat=n=3:v=1:a=0[v];\
[3:a]volume=volume=0:enable='between(t,6,8.5)+between(t,20,21.6)+between(t,34,37)+between(t,52,53.4)+gte(t,70)',aformat=channel_layouts=mono[a]" \
  -map "[v]" -map "[a]" \
  -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -t 75 "$out"

echo "wrote $out"
ffprobe -v error -show_entries format=duration -of default=nw=1 "$out"
