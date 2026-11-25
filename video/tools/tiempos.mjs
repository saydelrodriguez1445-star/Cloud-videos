// Tiempos de cada palabra del guion, sacados de la transcripción de whisper y afinados con las pausas del audio.
//
//   palabras()  → [{ i, texto, norm, frase, inicio, fin }]   (una entrada por palabra del guion)
//   P("palabra", n = 1) → segundo en que EMPIEZA la n-ésima vez que se dice esa palabra
//
// Afinado:
//   1. Se alinean guion y transcripción por posición (distancia de edición sobre palabras normalizadas).
//   2. Los tokens que whisper junta («Latinoamérica.¿Qué», «Yel») se reparten entre sus palabras.
//   3. La primera palabra de cada frase se coloca al final de la pausa en la que cae (ffmpeg silencedetect).
//   4. Ninguna palabra dura menos de 70 ms ni empieza antes que la anterior.
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

// Números que whisper escribe con cifras y la voz dice con palabras.
const NUM = { "2,5": "dos coma cinco", "8,3": "ocho coma tres", "10": "diez", "0,5": "cero coma cinco", "1": "uno", "2": "dos", "3": "tres", "4": "cuatro" };
// DTW marca cada palabra un poco tarde: se adelanta este margen (medido contra la energía del audio).
const ADELANTO_DTW = 0.08;
// Grafías de whisper que son la misma palabra que en el guion (comprobado con los fonemas de Kokoro).
const IGUAL = { informe: "inform", yel: "y el" };

export const normaliza = (w) =>
  w.toLowerCase().normalize("NFC").replace(/[¿?¡!.,:;«»"()]/g, "").trim();

function expande(w) {
  const limpio = w.replace(/^[¿¡«"(]+|[.,:;?!»")]+$/g, "");
  const n = NUM[limpio] ?? IGUAL[normaliza(limpio)] ?? normaliza(limpio);
  return n.split(/\s+/).filter(Boolean);
}

function leeGuion(archivo) {
  const frases = fs.readFileSync(archivo, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
  const out = [];
  frases.forEach((f, fi) => {
    f.split(/\s+/).forEach((tok, k) => {
      out.push({ texto: tok, norm: normaliza(tok), frase: fi, primeraDeFrase: k === 0 });
    });
  });
  return { frases, palabras: out };
}

// whisper-cli --output-json-full con --dtw → [{ text, start, end }] por palabra.
function leeDTW(archivo) {
  const j = JSON.parse(fs.readFileSync(archivo, "utf8"));
  const pal = [];
  for (const seg of j.transcription) {
    for (const tk of seg.tokens) {
      if (tk.text.startsWith("[_") || tk.t_dtw < 0) continue;
      const t = tk.t_dtw / 100 - ADELANTO_DTW;
      if (tk.text.startsWith(" ") || !pal.length) pal.push({ text: tk.text.trim(), start: t, fin_seg: seg.offsets.to / 1000 });
      else pal[pal.length - 1].text += tk.text;
    }
  }
  return pal.map((w, k) => ({ text: w.text, start: Math.max(0, w.start), end: pal[k + 1] ? Math.max(pal[k + 1].start, w.start + 0.05) : w.fin_seg }));
}

function leeTranscripcion(archivo) {
  const t = archivo.includes("dtw") ? leeDTW(archivo) : JSON.parse(fs.readFileSync(archivo, "utf8"));
  const out = [];
  for (const w of t) {
    // Separa tokens pegados por puntuación: «Latinoamérica.¿Qué» → «Latinoamérica.» + «¿Qué»
    const partes = w.text.split(/(?<=[.?!])(?=[¿¡A-Za-zÁÉÍÓÚÑáéíóúñ])/);
    const sub = partes.flatMap((p) => expande(p).map((n) => ({ n, peso: n.length, corte: p !== partes[0] })));
    const total = sub.reduce((a, s) => a + s.peso, 0) || 1;
    let t0 = w.start;
    sub.forEach((s, k) => {
      const dur = ((w.end - w.start) * s.peso) / total;
      out.push({ norm: s.n, inicio: t0, fin: t0 + dur, tras_puntuacion: s.corte && sub[k - 1] && s.corte !== sub[k - 1].corte });
      t0 += dur;
    });
  }
  return out;
}

function silenciosDe(wav, ruido = -40, minimo = 0.12) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", wav, "-af", `silencedetect=noise=${ruido}dB:d=${minimo}`, "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const out = [];
  let ini = null;
  for (const line of r.split("\n")) {
    const a = line.match(/silence_start: ([\d.]+)/);
    const b = line.match(/silence_end: ([\d.]+)/);
    if (a) ini = parseFloat(a[1]);
    if (b && ini !== null) { out.push([ini, parseFloat(b[1])]); ini = null; }
  }
  return out;
}

function alinea(a, b) {
  const n = a.length, m = b.length;
  const D = Array.from({ length: n + 1 }, (_, i) => new Int32Array(m + 1).map((_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
    D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  const par = new Array(n).fill(-1);
  const difs = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      par[i - 1] = j - 1;
      if (a[i - 1] !== b[j - 1]) difs.push({ tipo: "cambia", guion: a[i - 1], voz: b[j - 1] });
      i--; j--;
    } else if (i > 0 && D[i][j] === D[i - 1][j] + 1) { difs.push({ tipo: "falta", guion: a[i - 1] }); i--; }
    else { difs.push({ tipo: "sobra", voz: b[j - 1], j: j - 1 }); j--; }
  }
  return { par, difs: difs.reverse() };
}

let CACHE = null;
export async function cargar({ guion = path.join(RAIZ, "guion.txt"), transcripcion = path.join(RAIZ, "assets/audio/transcript.json"), dtw = path.join(RAIZ, "assets/audio/transcript-dtw-full.json"), wav = path.join(RAIZ, "assets/audio/voz.wav") } = {}) {
  const G = leeGuion(guion);
  // El guion también se expande (por si una frase lleva cifras).
  const gTokens = [];
  G.palabras.forEach((p, gi) => expande(p.texto).forEach((n) => gTokens.push({ n, gi })));
  const T0 = leeTranscripcion(transcripcion);
  const { difs } = alinea(gTokens.map((x) => x.n), T0.map((x) => x.norm));
  const usaDTW = fs.existsSync(dtw);
  const T = usaDTW ? leeTranscripcion(dtw) : T0;
  const { par, difs: difsT } = alinea(gTokens.map((x) => x.n), T.map((x) => x.norm));
  // Sinalefa: una «a» sobrante tras una palabra que acaba en «a» es un artefacto de whisper.
  const reales = difs.filter((d) => !(d.tipo === "sobra" && d.voz === "a" && T0[d.j - 1]?.norm.endsWith("a")));
  const realesT = difsT.filter((d) => !(d.tipo === "sobra" && d.voz === "a" && T[d.j - 1]?.norm.endsWith("a")));

  // Tiempos por palabra del guion (unión de sus tokens alineados).
  const palabras = G.palabras.map((p, gi) => ({ ...p, i: gi, inicio: null, fin: null }));
  gTokens.forEach((g, k) => {
    const j = par[k];
    if (j < 0) return;
    const w = palabras[g.gi];
    w.inicio = w.inicio === null ? T[j].inicio : Math.min(w.inicio, T[j].inicio);
    w.fin = w.fin === null ? T[j].fin : Math.max(w.fin, T[j].fin);
  });
  // Huecos (palabras sin pareja): se interpolan entre vecinas.
  for (let k = 0; k < palabras.length; k++) {
    if (palabras[k].inicio !== null) continue;
    const prev = palabras[k - 1]?.fin ?? 0;
    let nx = k + 1; while (nx < palabras.length && palabras[nx].inicio === null) nx++;
    const next = palabras[nx]?.inicio ?? prev + 0.3;
    const huecos = nx - k;
    for (let h = 0; h < huecos; h++) {
      palabras[k + h].inicio = prev + ((next - prev) * h) / huecos;
      palabras[k + h].fin = prev + ((next - prev) * (h + 1)) / huecos;
    }
    k = nx - 1;
  }

  // Pausas del audio.
  const sil = silenciosDe(wav, -40, 0.12);
  // 3. Primera palabra de cada frase → final de la pausa más cercana a su inicio estimado (si hay una a menos de 0,5 s).
  for (const w of palabras) {
    if (!w.primeraDeFrase || w.i === 0) continue;
    let mejor = null;
    for (const [s0, s1] of sil) {
      const d = Math.abs(s1 - w.inicio);
      if (s1 >= w.inicio - 0.6 && s0 <= w.inicio + 0.5 && (mejor === null || d < mejor.d)) mejor = { d, s0, s1 };
    }
    if (mejor) {
      const prev = palabras[w.i - 1];
      w.inicio = mejor.s1;
      if (prev && prev.fin > mejor.s0) prev.fin = mejor.s0;
    }
  }
  // Palabras que empiezan dentro de una pausa → al final de la pausa.
  for (const w of palabras) for (const [s0, s1] of sil) if (w.inicio > s0 + 0.02 && w.inicio < s1) w.inicio = s1;
  // 4. Monotonía y duración mínima dentro de cada frase.
  for (let k = 1; k < palabras.length; k++) {
    const a = palabras[k - 1], b = palabras[k];
    if (b.inicio < a.inicio + 0.07) b.inicio = a.inicio + 0.07;
    if (a.fin > b.inicio) a.fin = b.inicio;
    if (a.fin < a.inicio + 0.05) a.fin = Math.min(b.inicio, a.inicio + 0.12);
  }
  const duracion = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], { encoding: "utf8" }));
  const ult = palabras[palabras.length - 1];
  if (ult.fin < ult.inicio + 0.1) ult.fin = Math.min(duracion, ult.inicio + 0.4);
  palabras.forEach((w) => { w.inicio = +w.inicio.toFixed(3); w.fin = +w.fin.toFixed(3); });
  CACHE = { frases: G.frases, palabras, silencios: sil, diferencias: reales, diferenciasTiempos: realesT, fuenteTiempos: usaDTW ? "whisper large-v3 + DTW" : "hyperframes transcribe", duracion };
  return CACHE;
}

// P("palabra", n): cuándo empieza la n-ésima vez que se dice «palabra» (sin tildes ni mayúsculas que importen).
export function P(palabra, n = 1) {
  if (!CACHE) throw new Error("Llama antes a cargar()");
  const q = normaliza(palabra);
  const hits = CACHE.palabras.filter((w) => w.norm === q);
  if (!hits[n - 1]) throw new Error(`P(«${palabra}», ${n}): la voz solo dice esa palabra ${hits.length} veces`);
  return hits[n - 1].inicio;
}
// Fin de la n-ésima aparición.
export function F(palabra, n = 1) {
  const q = normaliza(palabra);
  const hits = CACHE.palabras.filter((w) => w.norm === q);
  if (!hits[n - 1]) throw new Error(`F(«${palabra}», ${n}): no existe`);
  return hits[n - 1].fin;
}
// Inicio y fin de la frase k (0-based).
export function frase(k) {
  const ws = CACHE.palabras.filter((w) => w.frase === k);
  return { inicio: ws[0].inicio, fin: ws[ws.length - 1].fin, palabras: ws };
}

if (process.argv[1] && process.argv[1].endsWith("tiempos.mjs")) {
  const c = await cargar();
  console.log(`Duración de la voz: ${c.duracion.toFixed(3)} s · ${c.palabras.length} palabras · pausas: ${c.silencios.length}`);
  console.log("Tiempos desde: " + c.fuenteTiempos + (c.diferenciasTiempos.length ? " · difs: " + JSON.stringify(c.diferenciasTiempos) : ""));
  console.log(c.diferencias.length ? "DIFERENCIAS REALES:\n" + c.diferencias.map((d) => "  " + JSON.stringify(d)).join("\n") : "Guion y voz coinciden palabra por palabra.");
  let f = -1;
  for (const w of c.palabras) {
    if (w.frase !== f) { f = w.frase; process.stdout.write(`\n[${f + 1}] `); }
    process.stdout.write(`${w.texto}@${w.inicio.toFixed(2)} `);
  }
  console.log();
}
