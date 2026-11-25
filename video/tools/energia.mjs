// Imprime la energía (dB) del audio cada 20 ms entre dos tiempos: node tools/energia.mjs 0 1.5
import { spawnSync } from "node:child_process";
const [a, b] = process.argv.slice(2).map(Number);
const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", "assets/audio/voz.wav", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], { maxBuffer: 1e9 });
const x = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4);
const out = [];
for (let t = a; t < b; t += 0.02) {
  const i0 = Math.round(t * 16000); let s = 0;
  for (let k = 0; k < 320; k++) s += (x[i0 + k] || 0) ** 2;
  out.push(`${t.toFixed(2)}:${Math.round(10 * Math.log10(s / 320 + 1e-12))}`);
}
console.log(out.join(" "));
