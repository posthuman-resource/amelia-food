#!/usr/bin/env bash
# Processes .m4a voice recordings: noise reduction, voice clarity, high-quality output.
# Applies: high-pass (remove rumble) → FFT denoise → presence boost → gentle compression
# Output: AAC 192kbps stereo — high quality, universally supported by Web Audio API.
#
# Usage: bash scripts/convert-signal-audio.sh

set -euo pipefail

SRC_DIR="data/signals"
OUT_DIR="public/audio/signals"

mkdir -p "$OUT_DIR"

# Audio filter chain for voice clarity:
#   1. highpass at 80Hz — remove low-frequency rumble/hum
#   2. afftdn nr=10 nt=w — FFT-based noise reduction (moderate, white noise model)
#   3. equalizer at 3kHz +3dB — presence boost for vocal clarity
#   4. equalizer at 6kHz +1.5dB — air/brightness
#   5. acompressor — gentle compression to even out levels
FILTERS="highpass=f=80,afftdn=nr=10:nt=w,equalizer=f=3000:width_type=o:width=1.5:g=3,equalizer=f=6000:width_type=o:width=2:g=1.5,acompressor=threshold=-18dB:ratio=2.5:attack=10:release=100:makeup=2dB"

count=0
for src in "$SRC_DIR"/*.m4a; do
  [ -f "$src" ] || continue
  name=$(basename "$src" .m4a)
  out="$OUT_DIR/$name.m4a"
  echo "Processing $name.m4a"
  ffmpeg -y -i "$src" -af "$FILTERS" -c:a aac -b:a 192k "$out" 2>/dev/null
  count=$((count + 1))
  echo "  → $(du -h "$out" | cut -f1)"
done

if [ "$count" -eq 0 ]; then
  echo "No .m4a files found in $SRC_DIR/"
  exit 1
fi

echo "Done — $count file(s) processed to $OUT_DIR/"
