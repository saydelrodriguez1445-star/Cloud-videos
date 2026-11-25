#!/usr/bin/env bash
# Tiempos por palabra más precisos: whisper.cpp large-v3 con alineación DTW (sin flash attention).
# Usa el whisper-cli y el modelo que ya instaló `npx hyperframes transcribe`.
set -euo pipefail
cd "$(dirname "$0")/.."
W="$HOME/.cache/hyperframes/whisper"
TMP="$(mktemp -d)"
ffmpeg -hide_banner -loglevel error -y -i assets/audio/voz.wav -ac 1 -ar 16000 -c:a pcm_s16le "$TMP/voz16k.wav"
"$W/whisper.cpp/build/bin/whisper-cli" --model "$W/models/ggml-large-v3.bin" --language es \
  --dtw large.v3 --no-flash-attn --suppress-nst --output-json-full --output-file "$TMP/dtw" "$TMP/voz16k.wav" > "$TMP/log.txt" 2>&1
cp "$TMP/dtw.json" assets/audio/transcript-dtw-full.json
echo "OK → assets/audio/transcript-dtw-full.json"
