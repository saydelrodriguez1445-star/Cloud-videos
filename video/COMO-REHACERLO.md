# Cómo rehacer el vídeo «¿Qué país de Latinoamérica aguanta una inundación brutal?»

Todo vive en esta carpeta (`video/`). El vídeo no se edita a mano: lo escribe `tools/generar.mjs` a partir de la voz y
de sus tiempos, así que si cambias una frase o la voz, todo (animaciones, subtítulos y sonidos) se recoloca solo.

## 0 · Herramientas (una sola vez)

```bash
node --version            # 22 o más
python3 --version
ffmpeg -version
npx hyperframes skills    # skills de HyperFrames
npx hyperframes doctor    # comprueba el entorno
cd video && npm install   # mapa (Natural Earth), proyección d3 e iconos Lucide

# Voz gratis (Kokoro) en un entorno de Python aislado
python3 -m venv ../.venv && ../.venv/bin/pip install kokoro-onnx soundfile
export HYPERFRAMES_PYTHON="$(cd .. && pwd)/.venv/bin/python"
```

whisper-cpp se compila solo la primera vez que transcribes (hace falta git, cmake y un compilador de C) y el modelo
`large-v3` (unos 3 GB) se descarga una vez.

## 1 · Guion

- `guion.md`: el guion con lo que se ve en cada frase y de dónde sale cada dato.
- `guion.txt`: el texto que lee la voz, una frase por línea, sin saltos de línea dentro de una frase.
- Datos: `datos/ranking.py` calcula el ranking a partir del Excel de INFORM Risk Mid 2026 (`datos/fuente/`):

```bash
../.venv/bin/pip install openpyxl
../.venv/bin/python -I datos/ranking.py datos/fuente/INFORM_Risk_Mid_2026_v073.xlsx > datos/ranking_latam.csv
../.venv/bin/python -I tools/top-mundo.py datos/fuente/INFORM_Risk_Mid_2026_v073.xlsx > datos/top10_mundo.csv
```

`datos/ranking_latam.csv` tiene los 20 países ordenados: úsalo para contestar los comentarios de «Comenta tu país».

## 2 · Voz y tiempos de cada palabra

```bash
npx hyperframes tts guion.txt --voice ef_dora --lang es -o assets/audio/voz.wav     # em_alex = voz de hombre
npx hyperframes transcribe assets/audio/voz.wav --language es --model large-v3 --json
node tools/comparar.mjs          # compara voz y guion palabra por palabra
bash tools/transcribir-dtw.sh    # tiempos más precisos (whisper large-v3 con DTW)
node tools/tiempos.mjs           # tiempos finales de cada palabra y diferencias reales con el guion
```

- Con tu propia grabación: guárdala como `assets/audio/voz.wav` y sigue desde `transcribe`.
- Con ElevenLabs: genera el audio con tu clave en una variable de entorno (nunca en un archivo), guárdalo como
  `assets/audio/voz.wav` y sigue desde `transcribe`.

`tools/tiempos.mjs` es quien define `P("palabra", n)`: el segundo en que empieza la n-ésima vez que se dice esa palabra.
Usa la transcripción con DTW (adelantada 0,08 s), coloca el inicio de cada frase al final de su pausa (ffmpeg
`silencedetect`) y separa los tokens que whisper junta.

## 3 · Animación

```bash
node tools/generar.mjs                       # escribe index.html y compositions/*.html
npx hyperframes lint
npx hyperframes check                        # debe acabar con 0 errores
npx hyperframes snapshot --at 3,13,22,29,35,42,45   # capturas para revisar
npx hyperframes preview --background         # previsualización en el navegador (Studio)
```

Piezas del generador:

| Archivo | Qué hace |
|---|---|
| `tools/generar.mjs` | Cámara, mapa, intro (ola, lluvia, web de INFORM), final, subtítulos, sonidos y escritura de la composición |
| `tools/estaciones.mjs` | Cada parada: Cuba, Costa Rica, Chile, Uruguay y Haití (vecinos, tarjetas, objetos) |
| `tools/personaje.mjs` | Personajes SVG articulados (poses, andar, correr, parpadeo) |
| `tools/mapa.mjs` | Mapa real de Latinoamérica (Natural Earth 50m) proyectado a SVG |
| `tools/tiempos.mjs` | Tiempos de cada palabra y `P()` |

## 4 · Sonido y mezcla

- Efectos (Pixabay, licencia libre): `assets/sfx/` (créditos en `assets/sfx/CREDITOS-Pixabay.md`). El generador los
  coloca para que su pico caiga un fotograma después de su imagen (`assets/sfx/picos.json`).
- Música (Mixkit, «Cyberpunk City»): `assets/musica/` (créditos y licencia en `assets/musica/CREDITOS.md`).
- `tools/mezclar.mjs` hace la mezcla final con ffmpeg: voz + música (que baja sola cuando habla la voz) + efectos, y lo
  deja a −14 LUFS con pico real de −1 dBTP (loudnorm en dos pasadas).

## 5 · Render y entrega

```bash
# Con subtítulos
node tools/generar.mjs
npx hyperframes render --quality delivery -o renders/render-con-subtitulos.mp4
node tools/mezclar.mjs renders/render-con-subtitulos.mp4 video-FINAL.mp4

# Sin subtítulos
node tools/generar.mjs --sin-subtitulos
npx hyperframes render --quality delivery -o renders/render-sin-subtitulos.mp4
node tools/mezclar.mjs renders/render-sin-subtitulos.mp4 video-SIN-SUBTITULOS.mp4
node tools/generar.mjs                       # deja el proyecto otra vez con subtítulos
```

## 6 · Comprobaciones

```bash
npx hyperframes check                                                    # 0 errores
node tools/zonas-seguras.cjs 3002 0.6,3.4,9.5,15.5,22.5,29.3,35.9,42.4,45.8   # con la previsualización en marcha
ffmpeg -i video-FINAL.mp4 -vf blackdetect=d=0.1:pix_th=0.10 -an -f null -   # sin fotogramas negros
ffprobe -v error -show_entries format=duration -of csv=p=0 video-FINAL.mp4  # = duración de la voz
ffmpeg -i video-FINAL.mp4 -af ebur128=peak=true -f null -                   # −14 LUFS
```
