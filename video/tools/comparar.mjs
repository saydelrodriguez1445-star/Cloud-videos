// Compara la transcripción (assets/audio/transcript.json) con guion.txt palabra a palabra.
// Uso: node tools/comparar.mjs
import fs from "node:fs";
const NUM = { "2,5": "dos coma cinco", "8,3": "ocho coma tres", "10": "diez", "4": "cuatro", "3": "tres", "2": "dos", "1": "uno", "0,5": "cero coma cinco" };
const norm = (w) => w.toLowerCase().normalize("NFC").replace(/[¿?¡!.,:;«»"]/g, "").trim();
const expand = (w) => (NUM[norm(w)] ?? norm(w)).split(/\s+/).filter(Boolean);
const guion = fs.readFileSync("guion.txt", "utf8").split(/\s+/).flatMap(expand);
const t = JSON.parse(fs.readFileSync("assets/audio/transcript.json", "utf8"));
const words = (Array.isArray(t) ? t : t.words ?? t.segments?.flatMap((s) => s.words) ?? []);
const trans = words.flatMap((w) => expand(w.text ?? w.word));
// alineación por distancia de edición
const n = guion.length, m = trans.length;
const D = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
  D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (guion[i - 1] === trans[j - 1] ? 0 : 1));
const ops = []; let i = n, j = m;
while (i > 0 || j > 0) {
  if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (guion[i - 1] === trans[j - 1] ? 0 : 1)) { if (guion[i - 1] !== trans[j - 1]) ops.push(`CAMBIA  guion «${guion[i - 1]}» → voz «${trans[j - 1]}»`); i--; j--; }
  else if (i > 0 && D[i][j] === D[i - 1][j] + 1) { ops.push(`FALTA   «${guion[i - 1]}»`); i--; }
  else { ops.push(`SOBRA   «${trans[j - 1]}»`); j--; }
}
console.log(`Guion: ${n} palabras · Transcripción: ${m} palabras · Diferencias: ${ops.length}`);
ops.reverse().forEach((o) => console.log("  " + o));
