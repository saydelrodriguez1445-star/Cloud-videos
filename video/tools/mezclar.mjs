// Mezcla final con ffmpeg: voz + música (que se aparta sola cuando habla la voz) + efectos, normalizado a −14 LUFS.
//   node tools/mezclar.mjs <video-renderizado.mp4> <salida.mp4>
// Lee datos/mezcla.json (lo escribe tools/generar.mjs) y sustituye el audio del vídeo por la mezcla.
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const [entrada, salida] = process.argv.slice(2);
if (!entrada || !salida) { console.error("Uso: node tools/mezclar.mjs <entrada.mp4> <salida.mp4>"); process.exit(1); }
const M = JSON.parse(fs.readFileSync(path.join(RAIZ, "datos/mezcla.json"), "utf8"));
const D = M.duracion;
const OBJ = { I: -14, TP: -1, LRA: 11 };
const tmp = fs.mkdtempSync(path.join(path.dirname(path.resolve(salida)), ".mezcla-"));
const mezcla = path.join(tmp, "mezcla.wav");

// 1. Grafo de filtros
const args = ["-hide_banner", "-y", "-i", path.join(RAIZ, M.voz.archivo), "-ss", String(M.musica.desde), "-t", String(D + 0.5), "-i", path.join(RAIZ, M.musica.archivo)];
M.efectos.forEach((e) => args.push("-i", path.join(RAIZ, e.archivo)));
const f = [];
f.push(`[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${M.voz.volumen},asplit=2[voz][vozsc]`);
f.push(`[1:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${D},asetpts=PTS-STARTPTS,volume=${M.musica.volumen},afade=t=in:d=${M.musica.fundidoEntrada},afade=t=out:st=${(D - M.musica.fundidoSalida).toFixed(3)}:d=${M.musica.fundidoSalida}[mus0]`);
// La música baja ~6 dB mientras suena la voz y vuelve en las pausas: nunca hay silencio total.
f.push(`[mus0][vozsc]sidechaincompress=threshold=0.03:ratio=4:attack=30:release=350:makeup=1[mus]`);
const etiquetas = ["[voz]", "[mus]"];
M.efectos.forEach((e, i) => {
  const ms = Math.round(e.inicio * 1000);
  f.push(`[${i + 2}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${e.dur},asetpts=PTS-STARTPTS,volume=${e.vol},adelay=${ms}|${ms}[e${i}]`);
  etiquetas.push(`[e${i}]`);
});
f.push(`${etiquetas.join("")}amix=inputs=${etiquetas.length}:normalize=0:duration=first,atrim=0:${D}[mix]`);

// 2. Sonoridad: se mide la mezcla, se aplica la ganancia que falta hasta −14 LUFS y un limitador de picos a −1,5 dBFS
//    (pico real ≤ −1 dBTP). Se repite si el resultado se desvía más de 0,2 LU.
const mide = (archivo) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", archivo, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  return { I: parseFloat(r.match(/I:\s+(-?[\d.]+) LUFS/g).pop().match(/-?[\d.]+/)[0]), TP: parseFloat((r.match(/Peak:\s+(-?[\d.]+) dBFS/g) || ["Peak: 0"]).pop().match(/-?[\d.]+/)[0]) };
};
const cruda = path.join(tmp, "cruda.wav");
execFileSync("ffmpeg", [...args, "-filter_complex", f.join(";"), "-map", "[mix]", "-c:a", "pcm_f32le", cruda], { stdio: ["ignore", "ignore", "pipe"] });
const med = mide(cruda);
let ganancia = OBJ.I - med.I, final = null;
// Se mide ya codificado en AAC (que es lo que se publica): la codificación mueve un poco la sonoridad y los picos.
const prueba = path.join(tmp, "prueba.m4a");
for (let intento = 0; intento < 5; intento++) {
  execFileSync("ffmpeg", ["-hide_banner", "-y", "-i", cruda, "-af", `volume=${ganancia.toFixed(2)}dB,alimiter=limit=0.79:attack=1.5:release=60:level=false,aresample=48000:resampler=soxr:osf=s16`, "-c:a", "pcm_s16le", mezcla], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("ffmpeg", ["-hide_banner", "-y", "-i", mezcla, "-c:a", "aac", "-b:a", "192k", prueba], { stdio: ["ignore", "ignore", "pipe"] });
  final = mide(prueba);
  if (Math.abs(final.I - OBJ.I) <= 0.1) break;
  ganancia += OBJ.I - final.I;
}
med.input_i = med.I;
// 4. Sustituir el audio del vídeo (la imagen se copia tal cual)
execFileSync("ffmpeg", ["-hide_banner", "-y", "-i", entrada, "-i", mezcla, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", String(D), "-movflags", "+faststart", salida], { stdio: ["ignore", "ignore", "pipe"] });
// 5. Medida final
const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", salida, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const I = r.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop(), TPk = r.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Mezcla → ${salida} · ${I} · pico real ${TPk} · medida previa ${med.input_i} LUFS`);
