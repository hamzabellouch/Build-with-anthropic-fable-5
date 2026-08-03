#!/usr/bin/env bash
# Builds samples/speech.mp4 — a synthetic vlog with REAL speech (Soniox TTS):
# contains a deliberate flubbed take, long pauses, and two visually-stale
# sections, so the live pipeline has everything to find.
# Requires SONIOX_API_KEY in .env.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a
mkdir -p samples/tts

say() { # say <index> <text>
  local out="samples/tts/s$1.wav"
  [ -s "$out" ] && return 0
  curl -sf --max-time 90 -X POST https://tts-rt.soniox.com/tts \
    -H "Authorization: Bearer $SONIOX_API_KEY" -H "Content-Type: application/json" \
    -d "{\"model\":\"tts-rt-v1\",\"language\":\"en\",\"voice\":\"Adrian\",\"audio_format\":\"wav\",\"sample_rate\":24000,\"text\":$(node -e "console.log(JSON.stringify(process.argv[1]))" "$2")}" \
    -o "$out"
  echo "tts s$1: $(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$out")s"
}

say 1 "Hey everyone, welcome back to the channel."
say 2 "Today I want to show you how I automated my entire video editing workflow with A.I."
say 3 "So the first step is to extract the... ugh, wait, that was terrible. Let me say that again."
say 4 "So the first step is extracting the audio from the raw recording."
say 5 "We send it to a speech to text model that returns every word with precise timestamps."
say 6 "Long pauses become cut candidates, and a language model reads the transcript like an editor, hunting for bad takes."
say 7 "Then a vision model watches for stretches where the screen stays static, and designs a graphic to illustrate the concept being explained."
say 8 "Everything is rendered by ffmpeg in a single pass. Cuts, graphics, and loudness normalization."
say 9 "If you enjoyed this one, subscribe for more, and I will see you in the next video."

sil() { # sil <name> <seconds>
  [ -s "samples/tts/$1.wav" ] || ffmpeg -y -v error -f lavfi -i anullsrc=r=24000:cl=mono -t "$2" "samples/tts/$1.wav"
}
sil g04 0.4; sil g05 0.5; sil g18 1.8; sil g24 2.4; sil g26 2.6; sil g32 3.2; sil g40 4.0

cat > samples/tts/list.txt <<EOF
file 's1.wav'
file 'g04.wav'
file 's2.wav'
file 'g26.wav'
file 's3.wav'
file 'g18.wav'
file 's4.wav'
file 'g04.wav'
file 's5.wav'
file 'g32.wav'
file 's6.wav'
file 'g05.wav'
file 's7.wav'
file 'g24.wav'
file 's8.wav'
file 'g05.wav'
file 's9.wav'
file 'g40.wav'
EOF
ffmpeg -y -v error -f concat -safe 0 -i samples/tts/list.txt -c:a pcm_s16le samples/tts/speech.wav
D=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 samples/tts/speech.wav)
S=$(node -e "console.log((Number(process.argv[1])/3).toFixed(3))" "$D")
echo "speech: ${D}s, video sections: ${S}s each"

ffmpeg -y -v error \
  -f lavfi -i "testsrc2=size=1280x720:rate=30:duration=$S" \
  -f lavfi -i "color=c=0x16324f:size=1280x720:rate=30:duration=$S" \
  -f lavfi -i "smptehdbars=size=1280x720:rate=30:duration=$S" \
  -i samples/tts/speech.wav \
  -filter_complex "[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]" \
  -map "[v]" -map 3:a -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -shortest samples/speech.mp4

echo "wrote samples/speech.mp4"
