// Filtra el informe de `npx hyperframes check` con las zonas seguras del encargo
// (nada importante en los 220 px de arriba, los 420 de abajo ni a menos de 60 px de los lados).
//   node tools/zonas-seguras-check.mjs .hyperframes/artifacts/checks/<informe>.json
import fs from "node:fs";
const Z = { izq: 60, der: 1020, arriba: 220, abajo: 1500 };
const j = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const L = j.layout;
const f = L.findings.filter((x) => x.code === "outside_safe_zone");
const fuera = f.filter((x) => { const r = x.rect; return r.left < Z.izq - 1 || r.right > Z.der + 1 || r.top < Z.arriba - 1 || r.bottom > Z.abajo + 1; });
console.log(`Muestras de layout: ${L.samples} · avisos de zona segura de HyperFrames (más estricta): ${f.length} · fuera de la zona del encargo: ${fuera.length}`);
for (const x of fuera) console.log(`  t=${x.time}s ${x.selector} «${(x.text || "").slice(0, 30)}» rect=${JSON.stringify(x.rect)}`);
