// Generador del vídeo: lee los tiempos de la voz y escribe la composición de HyperFrames.
//   node tools/generar.mjs
// Si cambias guion.txt o la voz: vuelve a generar la voz, transcribe (y DTW) y ejecuta esto. Todo se recoloca solo.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { interpolateZoom } from "d3-interpolate";
import { cargar, P, F, frase } from "./tiempos.mjs";
import { construirMapa } from "./mapa.mjs";
import { svgPersonaje, RIG_JS } from "./personaje.mjs";
import { construirEstaciones } from "./estaciones.mjs";

const require = createRequire(import.meta.url);
const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const FPS = 30, W = 1080, H = 1920;
const TV = await cargar();
const D = +TV.duracion.toFixed(3);
const N = Math.ceil(D * FPS) + 1;
const f2 = (v) => +(+v).toFixed(3);

// ───────────────────────── Paleta y tipografía ─────────────────────────
const C = {
  fondo: "#07090d", rejilla: "rgba(150,170,200,0.07)", tierra: "#243142", borde: "#52627a",
  tinta: "#0b0f14", blanco: "#ffffff", agua: "#1e88ff", agua2: "#5cc8ff", bueno: "#22c55e", malo: "#ef4444",
  ambar: "#f5b301", azul: "#2f6bff", gris: "#5b6573",
  // versiones oscuras para texto sobre blanco (contraste ≥ 3:1)
  buenoTxt: "#15913f", ambarTxt: "#a86f00",
};
const FUENTE = "Inter, sans-serif";

// ───────────────────────── Datos ─────────────────────────
const csv = fs.readFileSync(path.join(RAIZ, "datos/ranking_latam.csv"), "utf8").trim().split("\n").map((l) => l.split(","));
const cab = csv[0];
const DATOS = csv.slice(1).map((r) => Object.fromEntries(r.map((v, i) => [cab[i], isNaN(+v) ? v : +v])));
const dato = (iso) => DATOS.find((d) => d.iso3 === iso);
const coma = (v) => String(v).replace(".", ",");
const ES = { SSD: "Sudán del Sur", SOM: "Somalia", COD: "R. D. del Congo", TCD: "Chad", AFG: "Afganistán", CAF: "R. Centroafricana", NER: "Níger", SDN: "Sudán", YEM: "Yemen", HTI: "Haití", SYR: "Siria", BFA: "Burkina Faso" };
const TOP10 = fs.readFileSync(path.join(RAIZ, "datos/top10_mundo.csv"), "utf8").trim().split("\n").slice(1).map((l) => l.split(","))
  .map(([puesto, , iso3, riesgo]) => ({ puesto, iso3, nombre: ES[iso3] ?? iso3, riesgo: +riesgo })).filter((d) => +d.puesto <= 10);
// Color de cada país según su puesto en el ranking de inundaciones (verde = aguanta, rojo = sufre).
function colorRiesgo(r) {
  const tramos = [[3.8, [34, 197, 94]], [5.0, [245, 179, 1]], [6.2, [249, 115, 22]], [7.5, [239, 68, 68]]];
  if (r <= tramos[0][0]) return `rgb(${tramos[0][1]})`;
  for (let i = 1; i < tramos.length; i++) if (r <= tramos[i][0]) {
    const [a, ca] = tramos[i - 1], [b, cb] = tramos[i], k = (r - a) / (b - a);
    return `rgb(${ca.map((c, j) => Math.round(c + (cb[j] - c) * k)).join(",")})`;
  }
  return `rgb(${tramos[tramos.length - 1][1]})`;
}

// ───────────────────────── Iconos (Lucide) ─────────────────────────
function icono(nombre, { tam = 48, color = "currentColor", grosor = 2.4, x = 0, y = 0, id = "" } = {}) {
  const raw = fs.readFileSync(require.resolve(`lucide-static/icons/${nombre}.svg`), "utf8");
  const interior = raw.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return `<svg ${id ? `id="${id}"` : ""} x="${x}" y="${y}" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round">${interior}</svg>`;
}

// ───────────────────────── Mapa ─────────────────────────
const MAPA = construirMapa({ alto: 6000 });
const pais = (iso) => MAPA.paises.find((p) => p.iso === iso);
// Punto donde se clava la chincheta de cada país (en el país, visible desde lejos).
const PIN = { CUB: [-170, 728], CRI: [-450, 1452], CHL: [250, 4350], URY: [1205, 4060], HTI: [218, 902] };

// ───────────────────────── Momentos clave (todos salen de la voz) ─────────────────────────
const t = {
  una: P("una"), inundacion: P("inundación"), brutal: P("brutal"), golpea: P("golpea"), latam: P("latinoamérica"),
  que: P("qué"), pais1: P("país", 1), aguanta: P("aguanta"), mejor: P("mejor", 1),
  lo: P("lo", 1), medimos: P("medimos"), indice: P("índice"), inform: P("inform"), y2026: P("2026"),
  comision: P("comisión"), europea: P("europea"), finEuropea: F("europea"),
  tres: P("tres", 1), datos: P("datos"), agua: P("agua"), fragil: P("frágil"), responde: P("responde", 1), pais2: P("país", 2), finPais2: F("país", 2),
  // Cuba
  num4: P("número", 1), cuatro: P("cuatro"), cuba: P("cuba"), riesgo1: P("riesgo", 1), rios1: P("ríos", 1), minimo: P("mínimo"), medio: P("medio"),
  punto: P("punto"), diez1: P("diez", 1), finDiez1: F("diez", 1), amenaza: P("amenaza"), mar: P("mar"), finMar: F("mar"),
  // Costa Rica
  num3: P("número", 2), tres2: P("tres", 2), costa: P("costa"), rica: P("rica"), pais3: P("país", 3), mejor2: P("mejor", 2), responde2: P("responde", 2),
  emergencia: P("emergencia"), region: P("región"), finRegion: F("región"),
  // Chile
  num2: P("número", 3), dos1: P("dos", 1), chile: P("chile"), rios2: P("ríos", 2), bajan: P("bajan"), andes: P("andes"), fuerza: P("fuerza"),
  pero1: P("pero", 1), peligro: P("peligro"), manda: P("manda"), alerta: P("alerta"), todos: P("todos"), moviles: P("móviles"), zona: P("zona"), finZona: F("zona"),
  // Uruguay (clímax)
  num1: P("número", 4), uno: P("uno"), uruguay: P("uruguay"), tambien: P("también"), inunda: P("inunda"), pero2: P("pero", 2), riesgo2: P("riesgo", 2),
  desastre: P("desastre"), bajo: P("bajo"), latam2: P("latinoamérica", 2), dos2: P("dos", 2), cinco: P("cinco"), diez2: P("diez", 2), finDiez2: F("diez", 2),
  // Haití
  peor: P("peor"), pasaria: P("pasaría"), haiti: P("haití"), vulnerabilidad: P("vulnerabilidad"), ocho: P("ocho"), diez3: P("diez", 3), finDiez3: F("diez", 3),
  decimo: P("décimo"), pais4: P("país", 4), riesgo3: P("riesgo", 3), mundo: P("mundo"), finMundo: F("mundo"),
  // Final
  comenta: P("comenta"), pais5: P("país", 5), digo: P("digo"), puesto: P("puesto"), queda: P("queda"), finQueda: F("queda"),
};
// Salidas de cada estación: en la pausa entre bloques.
const sal = {
  intro: t.finPais2 + 0.02,
  cuba: t.finMar + 0.02,
  cr: t.finRegion + 0.02,
  chile: t.finZona + 0.02,
  uru: t.finDiez2 + 0.05,
  haiti1: t.finDiez3 + 0.02,
  haiti2: t.finMundo + 0.02,
};

// ───────────────────────── Cámara (un solo mundo, una sola cámara) ─────────────────────────
// Vista = punto del mundo que queda en el centro de la pantalla (540, 960) y zoom.
const V = {
  inicio: { cx: -330, cy: 1080, z: 0.52 },
  mapa: { cx: 0, cy: 3000, z: 0.18 },
  cuba: { cx: -170, cy: 867, z: 1.4 },
  cr: { cx: -447, cy: 1523, z: 3.4 },
  chile: { cx: -420, cy: 4537, z: 0.36 },
  uru: { cx: 1220, cy: 4226, z: 1.6 },
  haiti: { cx: 207, cy: 951, z: 4.4 },
  haiti2: { cx: 207, cy: 1050, z: 2.0 },
  final: { cx: 0, cy: 3060, z: 0.18 },
};
// Movimientos: de la vista que haya en t0 a «a» en [t0, t1], por el camino de zoom más suave (van Wijk).
const MOV = [
  { t0: 0, t1: t.golpea + 0.12, a: V.mapa, ease: "salida" },
  { t0: t.lo, t1: t.tres, a: { cx: 0, cy: 3150, z: 0.185 }, ease: "suave" }, // deriva lenta detrás de la web
  { t0: sal.intro, t1: t.cuatro + 0.12, a: V.cuba, ease: "suave" },
  { t0: t.rios1, t1: sal.cuba, a: { ...V.cuba, z: 1.46 }, ease: "suave" },          // empuje lento mientras habla de Cuba
  { t0: sal.cuba, t1: t.costa, a: V.cr, ease: "suave" },
  { t0: t.responde2, t1: sal.cr, a: { ...V.cr, z: 3.3 }, ease: "suave" },           // se aleja un poco para enseñar el bloque entero
  { t0: sal.cr, t1: t.chile + 0.1, a: V.chile, ease: "suave" },
  { t0: t.alerta, t1: sal.chile, a: { ...V.chile, z: 0.35, cy: 4560 }, ease: "suave" },
  { t0: sal.chile, t1: t.uruguay, a: V.uru, ease: "suave" },
  { t0: t.dos2 - 0.02, t1: t.dos2 + 0.22, a: { ...V.uru, z: 1.68, cy: 4240 }, ease: "salida" }, // golpe de cámara en el clímax
  { t0: t.diez2, t1: sal.uru, a: { ...V.uru, z: 1.62 }, ease: "suave" },
  { t0: sal.uru, t1: t.haiti - 0.05, a: V.haiti, ease: "suave" },
  { t0: sal.haiti1, t1: t.decimo + 0.25, a: V.haiti2, ease: "suave" },
  { t0: sal.haiti2, t1: t.pais5, a: V.final, ease: "suave" },
];
const TEMBLORES = [{ t: t.golpea, amp: 26, dur: 0.55 }, { t: t.dos2, amp: 14, dur: 0.4 }];
const EASE = {
  suave: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  salida: (u) => 1 - Math.pow(1 - u, 3.2),
  lineal: (u) => u,
};
function camara(tt) {
  let v = { ...V.inicio };
  for (const m of MOV) {
    if (tt <= m.t0) break;
    const u = Math.min(1, (tt - m.t0) / (m.t1 - m.t0));
    const iz = interpolateZoom([v.cx, v.cy, W / v.z], [m.a.cx, m.a.cy, W / m.a.z]);
    const [cx, cy, w] = iz(EASE[m.ease](u));
    v = { cx, cy, z: W / w };
  }
  return v;
}
function temblor(tt) {
  let x = 0, y = 0;
  for (const s of TEMBLORES) {
    const d = tt - s.t; if (d < 0 || d > s.dur) continue;
    const k = s.amp * Math.pow(1 - d / s.dur, 2);
    x += k * Math.sin(d * 2 * Math.PI * 11); y += k * 0.7 * Math.cos(d * 2 * Math.PI * 13);
  }
  return [x, y];
}
const CAM = [];
let prev = null;
for (let f = 0; f < N; f++) {
  const tt = f / FPS, v = camara(tt), [sx, sy] = temblor(tt);
  // desenfoque proporcional a la velocidad en pantalla (solo en viajes rápidos)
  let blur = 0;
  if (prev) {
    const vel = Math.hypot((v.cx - prev.cx) * v.z, (v.cy - prev.cy) * v.z) + Math.abs(Math.log(v.z / prev.z)) * 900;
    blur = Math.max(0, Math.min(7, (vel - 22) / 9));
  }
  prev = v;
  CAM.push([+(540 - v.cx * v.z + sx).toFixed(2), +(960 - v.cy * v.z + sy).toFixed(2), +v.z.toFixed(5), +blur.toFixed(2)]);
}

// ───────────────────────── Capa de mundo (SVG en coordenadas del mundo) ─────────────────────────
const contendientes = ["CUB", "CRI", "CHL", "URY", "HTI"];
const svgPaises = MAPA.paises.map((p) => `<path id="m-${p.iso}" class="m-pais" d="${p.d}" fill="${C.tierra}" stroke="${C.borde}" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`).join("");
const clipTierra = `<clipPath id="m-clip-tierra">${MAPA.paises.map((p) => `<path d="${p.d}"/>`).join("")}</clipPath>`;

// Chinchetas «?» de las cuatro aspirantes (tamaño constante en pantalla: se escala con 1/zoom en render()).
const PINES = ["CUB", "CRI", "CHL", "URY", "HTI"];
const PUESTO = Object.fromEntries(DATOS.map((d) => [d.iso3, d.puesto]));
const pinPath = "M0,0 C-18,-28 -45,-50 -45,-85 A45,45 0 1 1 45,-85 C45,-50 18,-28 0,0 Z";
const svgPines = PINES.map((iso) => `
  <g id="pin-${iso}" class="pin" transform="translate(${PIN[iso][0]},${PIN[iso][1]})">
    <g id="pin-${iso}-in" opacity="0">
      <ellipse cx="0" cy="0" rx="20" ry="7" fill="#000" opacity="0.45"/>
      <path id="pin-${iso}-cuerpo" d="${pinPath}" fill="${iso === "HTI" ? C.malo : C.ambar}" stroke="${C.blanco}" stroke-width="7"/>
      <g clip-path="url(#clip-pin)"><g id="pin-${iso}-txt">
        <text x="0" y="-62" font-family="${FUENTE}" font-weight="900" font-size="64" text-anchor="middle" fill="${C.tinta}">${iso === "HTI" ? PUESTO[iso] : "?"}</text>
        <text x="0" y="28" font-family="${FUENTE}" font-weight="900" font-size="${PUESTO[iso] >= 10 ? 52 : 64}" text-anchor="middle" fill="${C.tinta}">${PUESTO[iso]}</text>
      </g></g>
    </g>
  </g>`).join("");
// Ruta-río entre paradas (curvas por el mar).
const RUTA = [["CUB", "CRI", sal.cuba, t.costa, -260], ["CRI", "CHL", sal.cr, t.chile + 0.1, -900], ["CHL", "URY", sal.chile, t.uruguay, 300], ["URY", "HTI", sal.uru, t.haiti - 0.05, 1300]];
const svgRuta = RUTA.map(([a, b, , , curva], i) => {
  const [x1, y1] = PIN[a], [x2, y2] = PIN[b], mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  const cx = mx + (-dy / L) * curva, cy = my + (dx / L) * curva;
  const d = `M${x1},${y1} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2},${y2}`;
  return `<path id="ruta${i}-g" d="${d}" fill="none" stroke="${C.agua}" stroke-width="22" stroke-linecap="round" opacity="0.35"/><path id="ruta${i}" d="${d}" fill="none" stroke="#8fd3ff" stroke-width="8" stroke-linecap="round"/>`;
}).join("");


// ───────────────────────── Capa HUD (pantalla) ─────────────────────────
// Ola gigante (coordenadas locales: 1700 de ancho, la cresta rompe hacia la derecha).
const olaPath = "M-900,1000 C-500,940 -150,820 160,640 C330,540 470,400 610,270 C780,150 960,70 1130,96 C1290,120 1380,230 1340,330 C1310,410 1220,420 1190,360 C1170,315 1200,282 1236,292 C1200,330 1150,380 1170,450 C1200,560 1330,610 1460,640 C1580,668 1720,740 1900,860 C2020,940 2140,985 2300,1000 Z";
const espuma = "M610,270 C780,150 960,70 1130,96 C1290,120 1380,230 1340,330 C1310,410 1220,420 1190,360";
// Gotas del golpe (deterministas).
function aleatorio(semilla) { let s = semilla >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const rnd = aleatorio(7);
const GOTAS = Array.from({ length: 18 }, (_, i) => ({ vx: (rnd() - 0.35) * 1500, vy: -900 - rnd() * 1300, r: 8 + rnd() * 14, x0: 380 + rnd() * 300 }));
const LLUVIA = Array.from({ length: 70 }, () => ({ x: rnd() * 1300 - 110, y: rnd() * 2200, v: 1700 + rnd() * 900, l: 50 + rnd() * 70, o: 0.12 + rnd() * 0.22 }));

const PRO = { id: "pro", semilla: 3, guion: [
  { t: 0, a: "corre", x: 150, y: 1484, s: 0.9, giro: 1 },
  { t: 0, x: 300, dur: t.golpea - 0.1 },
  { t: t.golpea - 0.12, a: "frena" },
  { t: t.golpea + 0.1, a: "agacha" },
  { t: t.latam + 0.1, a: "mira" },
  { t: t.que, a: "rasca" },
  { t: t.lo, a: "anda", x: 860, dur: 0.95, lineal: true },
  { t: t.lo + 0.95, a: "quieto", giro: -1 },
  { t: t.indice, a: "senala" },
  { t: t.comision, a: "pulgar" },
  { t: t.tres, a: "mira" },
  { t: sal.intro - 0.05, a: "corre", giro: 1, x: 1320, dur: 0.75, lineal: true },
  { t: t.comenta - 0.6, a: "corre", giro: -1, x: 1250, y: 1262, s: 0.74, dur: 0 },
  { t: t.comenta - 0.55, x: 945, dur: 0.55 },
  { t: t.comenta, a: "senalaCaja" },
  { t: t.queda, a: "celebra" },
] };

// ───────────────────────── Tarjeta del navegador (HTML, pantalla) ─────────────────────────
const URL_TXT = "jrc.ec.europa.eu";
const filas = [...DATOS].sort((a, b) => a.pais.localeCompare(b.pais, "es")).map((d) => ({ ...d, pais: d.pais.replace("República Dominicana", "Rep. Dominicana") })).map((d) => `
  <div class="fila"><span class="c-pais">${d.pais}</span><span class="c-num">${coma(d.agua.toFixed(1))}</span><span class="c-num">${coma(d.fragilidad.toFixed(1))}</span><span class="c-num">${coma(d.falta_respuesta.toFixed(1))}</span></div>`).join("");
const htmlWeb = `
  <div id="web">
    <div class="barra">
      <span class="punto" style="background:#ff5f57"></span><span class="punto" style="background:#febc2e"></span><span class="punto" style="background:#28c840"></span>
      <div class="url">${icono("lock", { tam: 40, color: "#5b6573", grosor: 2.6 })}<span id="web-url">${URL_TXT.split("").map((ch, i) => `<span class="u" id="u${i}">${ch}</span>`).join("")}</span><span id="web-caret"></span></div>
    </div>
    <div id="web-pagina">
      <div class="cabecera">
        <div id="web-titulo">INFORM <b>2026</b></div>
        <div id="web-boton">${icono("download", { tam: 46, color: "#fff", grosor: 2.8 })}<span>Descargar</span></div>
      </div>
      <div id="web-sub">Comisión Europea · JRC</div>
      <div class="tabla">
        <div class="fila th"><span class="c-pais">País</span>
          <span class="c-num" id="th-agua">${icono("droplets", { tam: 50, color: C.agua, grosor: 2.6 })}</span>
          <span class="c-num" id="th-vul">${icono("users", { tam: 50, color: C.ambar, grosor: 2.6 })}</span>
          <span class="c-num" id="th-resp">${icono("siren", { tam: 50, color: C.malo, grosor: 2.6 })}</span></div>
        <div class="ventana"><div id="web-filas">${filas}</div></div>
      </div>
      <div id="web-fichas">
        <div class="ficha" id="ficha-agua" style="background:#e8f2ff">${icono("droplets", { tam: 58, color: C.agua, grosor: 2.6 })}<span>Agua que te cae</span></div>
        <div class="ficha" id="ficha-vul" style="background:#fff5d6">${icono("users", { tam: 58, color: "#c98a00", grosor: 2.6 })}<span>Vulnerabilidad</span></div>
        <div class="ficha" id="ficha-resp" style="background:#ffe8e8">${icono("siren", { tam: 58, color: C.malo, grosor: 2.6 })}<span>Respuesta</span></div>
      </div>
    </div>
  </div>
  <div id="fuente">${icono("chart-column", { tam: 44, color: C.tinta, grosor: 2.6 })}<span>Fuente: INFORM 2026</span></div>
  <div id="leyenda"><div><i style="background:${C.bueno}"></i>Aguanta</div><div><i style="background:${C.malo}"></i>Sufre</div></div>
  <div id="comentario">
    <div class="avatar">${icono("user", { tam: 50, color: "#fff", grosor: 2.6 })}</div>
    <div class="texto">${"Mi país es…".split("").map((ch, i) => `<span class="cm" id="cm${i}">${ch === " " ? "&nbsp;" : ch}</span>`).join("")}<span class="caret"></span></div>
    <div id="cm-enviar">${icono("send", { tam: 46, color: "#fff", grosor: 2.6 })}</div>
  </div>
  <div id="cursor">${icono("mouse-pointer-2", { tam: 84, color: C.tinta, grosor: 2 }).replace('fill="none"', `fill="${C.blanco}"`)}</div>`;

// ───────────────────────── Animación (GSAP, tiempos pegados a la voz) ─────────────────────────
const TW = [];
const tw = (sel, de, a, en) => TW.push(`tl.fromTo(${JSON.stringify(sel)}, ${JSON.stringify(de)}, ${JSON.stringify({ ...a, immediateRender: false })}, ${f2(en)});`);
const set = (sel, props, en) => TW.push(`tl.set(${JSON.stringify(sel)}, ${JSON.stringify(props)}, ${f2(en)});`);

// Chinchetas: caen con rebote en cada palabra de la pregunta.
[t.pais1, t.aguanta - 0.08, t.aguanta + 0.14, t.mejor].forEach((en, i) => {
  const iso = PINES[i];
  tw(`#pin-${iso}-in`, { opacity: 0, y: -150, scale: 0.7, transformOrigin: "50% 100%" }, { opacity: 1, y: 0, scale: 1, transformOrigin: "50% 100%", duration: 0.42, ease: "bounce.out" }, en);
  tw(`#m-${iso}`, { fill: C.tierra }, { fill: "#cfd8e3", duration: 0.3, ease: "power2.out" }, en + 0.25);
});
// La web sube desde abajo cuando se dice «Lo medimos».
tw("#web", { y: 760, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: "expo.out" }, t.lo - 0.05);
tw("#hud-oscuro", { opacity: 0 }, { opacity: 0.5, duration: 0.4, ease: "power2.out" }, t.lo);
// La URL se escribe letra a letra.
const tTecleo0 = t.lo + 0.12, tTecleo1 = t.indice - 0.08;
URL_TXT.split("").forEach((_, i) => set(`#u${i}`, { display: "inline" }, tTecleo0 + ((tTecleo1 - tTecleo0) * i) / URL_TXT.length));
// La página carga en «índice»; el título se escribe por palabras.
tw("#web-pagina", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, t.indice);
tw("#web-titulo b", { color: "#0b0f14" }, { color: C.azul, duration: 0.2 }, t.y2026);
// Cursor: entra, va al botón y hace clic justo en «2026».
tw("#cursor", { x: 980, y: 1500, opacity: 0 }, { x: 860, y: 1140, opacity: 1, duration: 0.3, ease: "power2.out" }, t.indice);
tw("#cursor", { x: 860, y: 1140 }, { x: 800, y: 745, duration: Math.max(0.3, t.y2026 - t.indice - 0.42), ease: "power2.inOut" }, t.indice + 0.32);
tw("#cursor svg", { scale: 1 }, { scale: 0.82, duration: 0.07, ease: "power2.in", yoyo: true, repeat: 1 }, t.y2026 - 0.04);
tw("#web-boton", { scale: 1 }, { scale: 0.92, duration: 0.07, ease: "power2.in", yoyo: true, repeat: 1 }, t.y2026 - 0.04);
tw("#cursor", { x: 800, y: 745 }, { x: 890, y: 1010, duration: 0.6, ease: "power2.inOut" }, t.y2026 + 0.25);
// Subtítulo de la fuente en «Comisión».
tw("#web-sub", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }, t.comision);
// Las filas de datos entran como un rodillo desde que se pulsa «Descargar».
const nFilas = DATOS.length, alto = 66, visibles = 3;
tw(".tabla .ventana", { opacity: 0 }, { opacity: 1, duration: 0.15 }, t.y2026 + 0.12);
tw("#web-filas", { y: alto * visibles }, { y: -alto * (nFilas - visibles), duration: t.tres - (t.y2026 + 0.15), ease: "power2.inOut" }, t.y2026 + 0.15);

// ───────────────────────── Efectos de sonido (pico 1 fotograma después de su imagen) ─────────────────────────
const PICOS = JSON.parse(fs.readFileSync(path.join(RAIZ, "assets/sfx/picos.json"), "utf8"));
const SFX = [];
const sfx = (archivo, visual, vol = 0.6, dur) => {
  const p = PICOS[archivo];
  const inicio = Math.max(0, visual + 1 / FPS - p.pico);
  SFX.push({ archivo, inicio: f2(inicio), dur: f2(dur ?? Math.min(p.duracion, D - inicio)), vol });
};
sfx("whoosh-cinematic.mp3", t.golpea - 0.05, 0.42, 3.2);
sfx("impact-bass-1.mp3", t.golpea, 0.55);
[t.pais1, t.aguanta - 0.08, t.aguanta + 0.14, t.mejor].forEach((en, i) => sfx("pop.mp3", en + 0.3, [0.45, 0.38, 0.42, 0.36][i]));
sfx("whoosh-short.mp3", t.lo + 0.1, 0.4);
sfx("typing.mp3", tTecleo0 + 0.02, 0.35, 0.75);
sfx("click.mp3", t.y2026, 0.55);
sfx("whoosh.mp3", t.y2026 + 0.3, 0.22);

// ───────────────────────── «Tres datos»: la cabecera de la tabla se convierte en tres fichas ─────────────────────────
tw(".tabla", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power2.in" }, t.tres - 0.05);
[["#ficha-agua", t.agua], ["#ficha-vul", t.fragil], ["#ficha-resp", t.responde]].forEach(([sel, en]) => {
  tw(sel, { opacity: 0, scale: 0.5, x: 260 }, { opacity: 1, scale: 1, x: 0, duration: 0.45, ease: "back.out(1.6)" }, en - 0.04);
  sfx("pop.mp3", en + 0.08, 0.26);
});
// Al acabar la frase, la web vuela a la esquina y se queda como etiqueta de la fuente.
tw("#web", { scale: 1, x: 0, y: 0, opacity: 1 }, { scale: 0.3, x: -330, y: 760, opacity: 0, duration: 0.5, ease: "power3.in" }, sal.intro);
tw("#cursor", { opacity: 1 }, { opacity: 0, duration: 0.2 }, sal.intro);
tw("#hud-oscuro", { opacity: 0.5 }, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, sal.intro);
tw("#fuente", { opacity: 0, scale: 0.5, transformOrigin: "0% 50%" }, { opacity: 1, scale: 1, transformOrigin: "0% 50%", duration: 0.4, ease: "back.out(1.6)" }, sal.intro + 0.42);
// El suelo de la intro (tejado y charco) se queda atrás: la cámara «despega».
tw("#hud-suelo", { y: 0 }, { y: 760, duration: 0.8, ease: "power3.in" }, sal.intro + 0.05);
sfx("whoosh.mp3", sal.intro + 0.5, 0.34);

// ───────────────────────── Chinchetas: el «?» rueda hasta el puesto de cada país ─────────────────────────
const revela = (iso, en, salida) => {
  tw(`#pin-${iso}-txt`, { y: 0 }, { y: -90, duration: 0.38, ease: "back.out(1.6)" }, en);
  tw(`#pin-${iso}-in`, { scale: 1, transformOrigin: "50% 100%" }, { scale: 1.5, transformOrigin: "50% 100%", duration: 0.4, ease: "back.out(1.8)" }, en);
  tw(`#pin-${iso}-cuerpo`, { fill: C.ambar }, { fill: colorRiesgo(dato(iso).riesgo_inundacion), duration: 0.3 }, en + 0.1);
  if (salida) {
    tw(`#pin-${iso}-in`, { scale: 1.5, transformOrigin: "50% 100%" }, { scale: 1, transformOrigin: "50% 100%", duration: 0.35, ease: "power2.inOut" }, salida);
    tw(`#m-${iso}`, { fill: "#cfd8e3" }, { fill: colorRiesgo(dato(iso).riesgo_inundacion), duration: 0.5, ease: "power2.out" }, salida);
  }
  sfx("pop.mp3", en + 0.05, 0.42);
};
revela("CUB", t.cuatro, sal.cuba);
revela("CRI", t.tres2, sal.cr);
revela("CHL", t.dos1, sal.chile);
revela("URY", t.uno, sal.uru);
// Haití: su chincheta roja cae al llegar.
tw("#pin-HTI-in", { opacity: 0, y: -150, scale: 1.1, transformOrigin: "50% 100%" }, { opacity: 1, y: 0, scale: 1.5, transformOrigin: "50% 100%", duration: 0.45, ease: "bounce.out" }, t.haiti);
tw("#m-HTI", { fill: C.tierra }, { fill: "#cfd8e3", duration: 0.3 }, t.haiti);
tw("#m-HTI", { fill: "#cfd8e3" }, { fill: colorRiesgo(dato("HTI").riesgo_inundacion), duration: 0.5 }, sal.haiti2);
sfx("pop.mp3", t.haiti + 0.2, 0.42);
// Al llegar, el país de la parada se ilumina en blanco.
[["CUB", t.cuatro], ["CRI", t.tres2], ["CHL", t.dos1], ["URY", t.uno]].forEach(([iso, en]) => tw(`#m-${iso}`, { fill: "#cfd8e3" }, { fill: "#f1f5f9", duration: 0.3 }, en));

// Viajes de cámara: un whoosh distinto en cada uno (nunca el mismo seguido).
sfx("whoosh-short.mp3", sal.cuba + 0.45, 0.32);
sfx("whoosh-cinematic.mp3", sal.cr + 0.5, 0.26, 2.6);
sfx("whoosh.mp3", sal.chile + 0.45, 0.32);
sfx("whoosh-cinematic.mp3", sal.uru + 0.55, 0.34, 2.8);
sfx("whoosh-short.mp3", sal.haiti1 + 0.3, 0.26);
sfx("whoosh.mp3", sal.haiti2 + 0.5, 0.32);

// Brillo de abajo: azul en la intro, verde en el número uno, rojo en Haití.
TW.push(`tl.fromTo("#brillo", {"--brillo":"rgba(47,107,255,0.55)"}, {"--brillo":"rgba(34,197,94,0.5)", duration:0.6, ease:"power2.inOut", immediateRender:false}, ${f2(t.uno)});`);
TW.push(`tl.fromTo("#brillo", {"--brillo":"rgba(34,197,94,0.5)"}, {"--brillo":"rgba(239,68,68,0.55)", duration:0.8, ease:"power2.inOut", immediateRender:false}, ${f2(t.peor)});`);
TW.push(`tl.fromTo("#brillo", {"--brillo":"rgba(239,68,68,0.55)"}, {"--brillo":"rgba(47,107,255,0.55)", duration:0.8, ease:"power2.inOut", immediateRender:false}, ${f2(sal.haiti2)});`);

// Estaciones (Cuba, Costa Rica, Chile, Uruguay, Haití).
const EST = construirEstaciones({ t, sal, V, C, FUENTE, icono, dato, coma, tw, set, sfx, DATOS, TOP10 });

// ───────────────────────── Final: el mapa se pinta con el ranking y la caja de comentarios ─────────────────────────
const RANKING = [...DATOS].sort((a, b) => a.puesto - b.puesto);
RANKING.forEach((d, i) => {
  if (["CUB", "CRI", "CHL", "URY", "HTI"].includes(d.iso3)) return;
  tw(`#m-${d.iso3}`, { fill: C.tierra }, { fill: colorRiesgo(d.riesgo_inundacion), duration: 0.4, ease: "power2.out" }, sal.haiti2 + 0.4 + i * 0.045);
});
PINES.forEach((iso) => tw(`#pin-${iso}-in`, { scale: iso === "HTI" ? 1.5 : 1, transformOrigin: "50% 100%" }, { scale: 0.62, transformOrigin: "50% 100%", duration: 0.5, ease: "power2.inOut" }, sal.haiti2 + 0.3));
tw("#leyenda", { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, t.comenta - 0.1);
tw("#comentario", { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" }, t.comenta - 0.05);
const COMENTARIO = "Mi país es…";
const tc0 = t.pais5, tc1 = t.puesto;
COMENTARIO.split("").forEach((_, i) => set(`#cm${i}`, { display: "inline" }, tc0 + ((tc1 - tc0) * i) / COMENTARIO.length));
tw("#cm-enviar", { scale: 1, transformOrigin: "50% 50%" }, { scale: 1.15, transformOrigin: "50% 50%", duration: 0.15, yoyo: true, repeat: 1 }, t.queda);
sfx("pop.mp3", t.comenta + 0.05, 0.3);
sfx("typing.mp3", tc0, 0.3, Math.min(1.5, tc1 - tc0 + 0.2));
sfx("click.mp3", t.queda + 0.05, 0.4);

// ───────────────────────── Subtítulos palabra a palabra ─────────────────────────
// Palabras en pantalla: números como cifras («dos coma cinco» → «2,5») y el número del ranking como cifra.
const pal = TV.palabras;
const visibles_ = [];
for (let i = 0; i < pal.length; i++) {
  const w = pal[i], n = w.norm;
  const sig = (k) => pal[i + k]?.norm;
  if ((n === "dos" && sig(1) === "coma" && sig(2) === "cinco") || (n === "ocho" && sig(1) === "coma" && sig(2) === "tres")) {
    visibles_.push({ txt: n === "dos" ? "2,5" : "8,3", ini: w.inicio, fin: pal[i + 2].fin, frase: w.frase, idx: i }); i += 2; continue;
  }
  let txt = w.texto.replace(/[¿?¡!.,:;«»"]/g, "");
  if (n === "diez" && pal[i - 1]?.norm === "sobre") txt = "10";
  if (pal[i - 1]?.norm === "número") txt = { cuatro: "4", tres: "3", dos: "2", uno: "1" }[n] ?? txt;
  if (n === "inform") txt = "INFORM";
  visibles_.push({ txt, ini: w.inicio, fin: w.fin, frase: w.frase, idx: i, norm: n });
}
const CLAVE_BUENA = new Set(["mínimo", "mejor", "bajo", "1", "uruguay", "responde", "alerta", "2,5"]);
const CLAVE_MALA = new Set(["brutal", "inundación", "amenaza", "mar", "peligro", "vulnerabilidad", "haití", "peor", "8,3", "décimo", "fuerza"]);
const CLAVE = new Set(["latinoamérica", "país", "INFORM", "2026", "comisión", "datos", "agua", "frágil", "cuba", "costa", "rica", "chile", "andes", "móviles", "riesgo", "4", "3", "2", "10", "medio", "comenta", "inunda", "emergencia", "mundo", "puesto", "golpea", "aguanta", "europea"]);
const tipoClave = (v) => { const k = v.txt.toLowerCase(); if (CLAVE_BUENA.has(k)) return "bueno"; if (CLAVE_MALA.has(k)) return "malo"; if (CLAVE.has(k) || CLAVE.has(v.txt)) return "clave"; return null; };
// Grupos de 2 a 4 palabras. Cada frase se parte en cláusulas (por su puntuación o una pausa larga) y cada
// cláusula se reparte en trozos equilibrados de hasta 3 palabras, sin acabar un trozo en una palabra corta
// que pide la siguiente («de», «la», «con»…) ni separar nombres de dos palabras («Costa Rica»).
const FUNCION = new Set(["de", "la", "el", "los", "las", "a", "en", "con", "y", "que", "su", "sus", "del", "una", "un", "es", "lo", "se", "si", "te", "tu", "más", "muy", "mucha", "sobre", "toda", "todos", "cómo", "cuánta", "número"]);
const PEGADAS = new Set(["costa|rica"]);
const textoGuion = (v) => pal[v.idx].texto;
const clausulas = [];
let cl = [];
visibles_.forEach((v, k) => {
  const prevV = visibles_[k - 1];
  if (cl.length && (v.frase !== prevV.frase || /[,:;?]$/.test(textoGuion(prevV)) || v.ini - prevV.fin >= 0.3)) { clausulas.push(cl); cl = []; }
  cl.push(v);
});
if (cl.length) clausulas.push(cl);
// Reparto óptimo de cada cláusula (programación dinámica): grupos de 3 ideales, 2 o 4 aceptables, 1 solo si no queda otra;
// nunca acabar en palabra-función ni separar nombres pegados.
const COSTE_TAM = { 1: 3, 2: 0.6, 3: 0, 4: 0.9 };
const grupos = [];
for (const c of clausulas) {
  const n = c.length;
  const malFinal = (q) => (q < n ? (FUNCION.has(c[q - 1].txt.toLowerCase()) ? 4 : 0) + (PEGADAS.has(c[q - 1].txt.toLowerCase() + "|" + c[q].txt.toLowerCase()) ? 10 : 0) : 0);
  const best = [{ coste: 0, prev: -1 }];
  for (let i = 1; i <= n; i++) {
    best[i] = { coste: Infinity, prev: -1 };
    for (let tam = 1; tam <= 4 && tam <= i; tam++) {
      const j = i - tam;
      const coste = best[j].coste + (n === 1 ? 0 : COSTE_TAM[tam]) + malFinal(i);
      if (coste < best[i].coste) best[i] = { coste, prev: j };
    }
  }
  const trozos = [];
  for (let i = n; i > 0; i = best[i].prev) trozos.unshift(c.slice(best[i].prev, i));
  grupos.push(...trozos);
}

// Una palabra clave por grupo (la de más peso).
const PESO = { malo: 3, bueno: 3, clave: 2 };
grupos.forEach((gr) => {
  let mejor = null;
  gr.forEach((v) => { const tk = tipoClave(v); if (tk && (!mejor || PESO[tk] > PESO[mejor.tk] || (PESO[tk] === PESO[mejor.tk] && v.txt.length > mejor.v.txt.length))) mejor = { v, tk }; });
  if (mejor) mejor.v.clave = mejor.tk;
});
const COLOR_CLAVE = { bueno: C.bueno, malo: C.malo, clave: C.ambar };
let htmlSubs = "", twSubs = [];
grupos.forEach((gr, gi) => {
  const ini = Math.max(0.08, gr[0].ini - 0.06);
  const siguiente = grupos[gi + 1];
  const fin = Math.min(siguiente ? siguiente[0].ini - 0.06 : D, gr[gr.length - 1].fin + 0.5);
  htmlSubs += `<div id="sg${gi}" class="grupo clip" data-start="${f2(ini)}" data-duration="${f2(Math.max(0.2, fin - ini))}" data-track-index="0">${gr.map((v, k) => `<span id="sg${gi}w${k}" class="pal${v.clave ? " clave " + v.clave : ""}"${v.clave ? ` style="--c:${COLOR_CLAVE[v.clave]}"` : ""}>${v.txt}</span>`).join(" ")}</div>`;
  const dEntra = f2(Math.min(0.12, (fin - ini) / 3));
  twSubs.push(`tl.fromTo("#sg${gi}", {opacity:0, y:18}, {opacity:1, y:0, duration:${dEntra}, ease:"power3.out", immediateRender:false}, ${f2(ini)});`);
  gr.forEach((v, k) => {
    twSubs.push(`tl.fromTo("#sg${gi}w${k}", {opacity:0.32}, {opacity:1, duration:0.06, immediateRender:false}, ${f2(v.ini)});`);
    if (v.clave) twSubs.push(`tl.fromTo("#sg${gi}w${k}", {scale:0.7}, {scale:1, duration:0.28, ease:"back.out(2.2)", immediateRender:false}, ${f2(v.ini)});`);
  });
  twSubs.push(`tl.to("#sg${gi}", {opacity:0, duration:${dEntra}, ease:"power2.in"}, ${f2(fin - dEntra)});`);
});

// ───────────────────────── Escritura de archivos ─────────────────────────
const mundoHTML = `<template id="mundo-template">
<style>
  #root { position: absolute; inset: 0; overflow: hidden; background: ${C.fondo}; font-family: ${FUENTE}; }
  #fondo, #visor, #hud, #hud-oscuro { position: absolute; inset: 0; }
  #brillo { position: absolute; left: -20%; right: -20%; bottom: -560px; height: 1300px; border-radius: 50%;
    background: radial-gradient(closest-side, var(--brillo, rgba(47,107,255,0.55)), rgba(0,0,0,0)); }
  #visor { overflow: hidden; }
  #hud-oscuro { background: #000; opacity: 0; pointer-events: none; }
  #web { position: absolute; left: 60px; top: 470px; width: 960px; height: 600px; border-radius: 34px; background: #fff;
    box-shadow: 0 30px 80px rgba(0,0,0,0.55); overflow: hidden; opacity: 0; color: ${C.tinta}; }
  #web .barra { height: 92px; background: #eef1f5; display: flex; align-items: center; gap: 14px; padding: 0 26px; }
  #web .punto { width: 22px; height: 22px; border-radius: 50%; display: inline-block; }
  #web .url { margin-left: 14px; flex: 1; height: 64px; border-radius: 32px; background: #fff; display: flex; align-items: center; gap: 12px; padding: 0 22px;
    font-size: 46px; font-weight: 700; color: #3b4452; letter-spacing: -0.01em; }
  #web .u { display: none; }
  #web-caret { width: 4px; height: 46px; background: ${C.azul}; margin-left: 2px; }
  #web-pagina { padding: 26px 40px 0; opacity: 0; }
  #web .cabecera { display: flex; align-items: center; justify-content: space-between; }
  #web-titulo { font-size: 76px; font-weight: 900; letter-spacing: -0.03em; }
  #web-titulo b { font-weight: 900; }
  #web-boton { display: flex; align-items: center; gap: 12px; background: ${C.azul}; color: #fff; font-size: 46px; font-weight: 800; padding: 16px 28px; border-radius: 22px; }
  #web-sub { font-size: 46px; font-weight: 700; color: ${C.gris}; margin-top: 4px; opacity: 0; }
  #web .tabla { margin-top: 18px; }
  #web .fila { display: flex; align-items: center; white-space: nowrap; height: 66px; font-size: 46px; font-weight: 700; border-bottom: 2px solid #e6e9ee; }
  #web .th { border-bottom: 3px solid #cfd5dd; }
  #web .c-pais { flex: 1; }
  #web .c-num { width: 150px; text-align: right; font-variant-numeric: tabular-nums; display: flex; justify-content: flex-end; }
  #web .ventana { height: ${alto * visibles}px; overflow: hidden; opacity: 0; -webkit-mask-image: linear-gradient(#000 0, #000 75%, transparent 100%); mask-image: linear-gradient(#000 0, #000 75%, transparent 100%); }
  #web-fichas { position: absolute; left: 40px; right: 40px; top: 210px; display: flex; flex-direction: column; gap: 14px; }
  #web .ficha { height: 82px; border-radius: 22px; display: flex; align-items: center; gap: 22px; padding: 0 24px; font-size: 52px; font-weight: 800; opacity: 0; transform-origin: 100% 50%; }
  #fuente { position: absolute; left: 60px; top: 1418px; height: 70px; padding: 0 26px 0 18px; border-radius: 35px; background: rgba(255,255,255,0.94);
    display: flex; align-items: center; gap: 12px; font-size: 46px; font-weight: 800; color: ${C.tinta}; opacity: 0; }
  #leyenda { position: absolute; right: 60px; top: 450px; padding: 18px 28px; border-radius: 28px; background: rgba(11,15,20,0.82); border: 3px solid #334155;
    color: #fff; font-size: 46px; font-weight: 800; display: flex; flex-direction: column; gap: 10px; opacity: 0; }
  #leyenda i { display: inline-block; width: 34px; height: 34px; border-radius: 10px; margin-right: 16px; vertical-align: -4px; }
  #comentario { position: absolute; left: 60px; right: 60px; top: 1268px; height: 128px; border-radius: 64px; background: #fff; display: flex; align-items: center;
    gap: 22px; padding: 0 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); opacity: 0; }
  #comentario .avatar { width: 88px; height: 88px; border-radius: 50%; background: #8b9bb0; display: flex; align-items: center; justify-content: center; }
  #comentario .texto { flex: 1; font-size: 54px; font-weight: 800; color: ${C.tinta}; display: flex; align-items: center; }
  #comentario .cm { display: none; }
  #comentario .caret { width: 5px; height: 56px; background: ${C.azul}; margin-left: 4px; }
  #cm-enviar { width: 88px; height: 88px; border-radius: 50%; background: ${C.azul}; display: flex; align-items: center; justify-content: center; }
  #cursor { position: absolute; left: 0; top: 0; opacity: 0; filter: drop-shadow(0 6px 10px rgba(0,0,0,0.5)); }
  #cursor svg { display: block; }
  .m-pais { transition: none; }
</style>
<div id="root" data-composition-id="mundo" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
  <div id="fondo">
    <svg width="${W}" height="${H}" style="position:absolute;inset:0">
      <defs><pattern id="rejilla" width="90" height="90" patternUnits="userSpaceOnUse"><path d="M90,0 L0,0 0,90" fill="none" stroke="${C.rejilla}" stroke-width="2"/></pattern></defs>
      <rect id="rejilla-rect" x="-180" y="-180" width="${W + 360}" height="${H + 360}" fill="url(#rejilla)"/>
    </svg>
    <div id="brillo"></div>
  </div>
  <div id="visor">
    <svg width="${W}" height="${H}" style="position:absolute;inset:0;overflow:hidden">
      <defs>${clipTierra}${EST.defs}
        <clipPath id="clip-pin"><circle cx="0" cy="-85" r="40"/></clipPath>
        <clipPath id="clip-URY"><path d="${pais("URY").d}"/></clipPath>
        <clipPath id="clip-HTI"><path d="${pais("HTI").d}"/></clipPath>
        <linearGradient id="g-agua" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.agua2}" stop-opacity="0.62"/><stop offset="1" stop-color="${C.agua}" stop-opacity="0.45"/></linearGradient>
      </defs>
      <g id="camara">
        <path id="oleaje-CUB" d="${pais("CUB").d}" fill="none" stroke="#3aa0ff" stroke-width="0" stroke-linejoin="round" opacity="0.75"/>
        <path id="oleaje-CUB2" d="${pais("CUB").d}" fill="none" stroke="#8fd3ff" stroke-width="0" stroke-linejoin="round" opacity="0.4"/>
        <g id="m-paises">${svgPaises}</g>
        <g clip-path="url(#clip-URY)"><path id="agua-URY" d="" fill="url(#g-agua)"/></g>
        <g clip-path="url(#clip-HTI)"><path id="agua-HTI" d="" fill="url(#g-agua)"/></g>
        <g id="m-ruta">${svgRuta}</g>
        <g id="m-estaciones">${EST.svg}</g>
        <g id="m-pines">${svgPines}</g>
        <g id="m-inundacion" clip-path="url(#m-clip-tierra)">
          <path id="m-agua" d="" fill="url(#g-agua)"/>
          <path id="m-agua-linea" d="" fill="none" stroke="#bfe6ff" stroke-width="6" vector-effect="non-scaling-stroke" opacity="0.8"/>
        </g>
      </g>
    </svg>
  </div>
  <div id="hud-oscuro"></div>
  <svg id="hud" width="${W}" height="${H}" style="position:absolute;inset:0;overflow:hidden">
    <defs>
      <linearGradient id="g-ola" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fb6ff"/><stop offset="0.55" stop-color="#1667e8"/><stop offset="1" stop-color="#0b3aa8"/></linearGradient>
      <linearGradient id="g-charco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3aa0ff" stop-opacity="0.95"/><stop offset="1" stop-color="#0b3aa8" stop-opacity="0.95"/></linearGradient>
    </defs>
    <g id="lluvia">${LLUVIA.map((g_, i) => `<line id="ll${i}" x1="0" y1="0" x2="${(-g_.l * 0.21).toFixed(1)}" y2="${g_.l.toFixed(1)}" stroke="#cfe8ff" stroke-width="3" stroke-linecap="round" opacity="${g_.o.toFixed(2)}"/>`).join("")}</g>
    <g id="ola" transform="translate(-1800,560)" opacity="0">
      <path d="${olaPath}" fill="url(#g-ola)"/>
      <path d="${espuma}" fill="none" stroke="#e8f6ff" stroke-width="26" stroke-linecap="round" opacity="0.9"/>
    </g>
    <g id="hud-suelo" data-layout-allow-overflow>
    <path id="charco" d="" fill="url(#g-charco)"/>
    <path id="charco-linea" d="" fill="none" stroke="#bfe6ff" stroke-width="7" opacity="0.85"/>
    <g id="tejado"><rect x="-40" y="1484" width="1160" height="120" rx="6" fill="#1b2430" stroke="#3a4757" stroke-width="5"/><rect x="-40" y="1484" width="1160" height="18" fill="#2a3442"/><rect x="90" y="1512" width="120" height="60" rx="6" fill="#141b24"/><rect x="330" y="1512" width="120" height="60" rx="6" fill="#141b24"/><rect x="600" y="1512" width="120" height="60" rx="6" fill="#141b24"/><rect x="870" y="1512" width="120" height="60" rx="6" fill="#141b24"/></g>
    </g>
    <g id="gotas" data-layout-allow-overflow>${GOTAS.map((g_, i) => `<circle id="go${i}" cx="0" cy="0" r="${g_.r.toFixed(1)}" fill="#9fd8ff" opacity="0"/>`).join("")}</g>
    ${svgPersonaje("pro", { tipo: "capucha", ropa: "#ffcc00", ropa2: "#d9a400", piel: "#c98d63", pelo: "#2a1a12", pantalon: "#22324a", zapatos: "#1f6feb" })}
  </svg>
  ${htmlWeb}
</div>
<script>
(function () {
  const D = ${D}, FPS = ${FPS};
  const CAM = ${JSON.stringify(CAM)};
  const T = ${JSON.stringify({ ...t, salCuba: sal.cuba })};
  const GOTAS = ${JSON.stringify(GOTAS.map((g_) => ({ vx: +g_.vx.toFixed(1), vy: +g_.vy.toFixed(1), x0: +g_.x0.toFixed(1) })))};
  const LLUVIA = ${JSON.stringify(LLUVIA.map((g_) => ({ x: +g_.x.toFixed(1), y: +g_.y.toFixed(1), v: +g_.v.toFixed(1) })))};
  const PIN = ${JSON.stringify(PIN)};
  ${RIG_JS}
  const PERSONAJES = ${JSON.stringify([...EST.personajes, PRO])};
  const RUTA = ${JSON.stringify(RUTA.map(([, , t0, t1]) => [f2(t0), f2(t1)]))};
  const BB = ${JSON.stringify({ URY: pais("URY").bbox, HTI: pais("HTI").bbox })};
  PERSONAJES.forEach(preparaPersonaje);
  const $ = (id) => document.getElementById(id);
  const cam = $("camara"), visor = $("visor"), rejilla = $("rejilla-rect");
  const agua = $("m-agua"), aguaL = $("m-agua-linea"), charco = $("charco"), charcoL = $("charco-linea"), ola = $("ola");
  const lluvia = LLUVIA.map((_, i) => $("ll" + i)), gotas = GOTAS.map((_, i) => $("go" + i));
  const pines = ${JSON.stringify(PINES)}.map((iso) => ({ iso, el: $("pin-" + iso) }));
  const ruta = RUTA.map((r, i) => { const a = $("ruta" + i), b = $("ruta" + i + "-g"), L = a.getTotalLength(); for (const e of [a, b]) { e.style.strokeDasharray = L; e.style.strokeDashoffset = L; } return { a, b, L, t0: r[0], t1: r[1] }; });
  const oleaje = $("oleaje-CUB"), oleaje2 = $("oleaje-CUB2"), aguaURY = $("agua-URY"), aguaHTI = $("agua-HTI"), olaHTI = $("hti-ola-frente");
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const entre = (tt, a, b) => clamp((tt - a) / (b - a), 0, 1);
  function camaraEn(tt) {
    const f = clamp(tt * FPS, 0, CAM.length - 1), i = Math.floor(f), k = f - i, a = CAM[i], b = CAM[Math.min(i + 1, CAM.length - 1)];
    return a.map((v, j) => v + (b[j] - v) * k);
  }
  // Superficie de agua ondulada: borde superior a «nivel», de x0 a x1.
  function olas(x0, x1, nivel, amp, fase, paso, fondo) {
    let d = "M" + x0 + "," + fondo + " L" + x0 + "," + (nivel + amp * Math.sin(fase)).toFixed(1);
    for (let x = x0 + paso; x <= x1 + paso; x += paso) d += " L" + x + "," + (nivel + amp * Math.sin(fase + x * 0.012) + amp * 0.5 * Math.sin(fase * 1.7 + x * 0.031)).toFixed(1);
    return d + " L" + (x1 + paso) + "," + fondo + " Z";
  }
  function render(tt) {
    // Cámara
    const [tx, ty, z, blur] = camaraEn(tt);
    cam.setAttribute("transform", "translate(" + tx.toFixed(2) + "," + ty.toFixed(2) + ") scale(" + z.toFixed(5) + ")");
    visor.style.filter = blur > 0.3 ? "blur(" + blur.toFixed(2) + "px)" : "none";
    rejilla.setAttribute("transform", "translate(" + (((tx * 0.12) % 90) - 0).toFixed(1) + "," + (((ty * 0.12) % 90)).toFixed(1) + ")");
    // Chinchetas: tamaño constante en pantalla
    const ps = 1 / z;
    for (const p of pines) p.el.setAttribute("transform", "translate(" + PIN[p.iso][0] + "," + PIN[p.iso][1] + ") scale(" + ps.toFixed(4) + ")");
    // Inundación del mapa: sube de sur a norte con el golpe y se retira al empezar el viaje
    const subida = suave(entre(tt, T.golpea - 0.05, T.latam + 0.75)), bajada = suave(entre(tt, T.tres, T.tres + 1.4));
    const nivel = 6100 - 6400 * subida + 6400 * bajada;
    if (nivel < 6080) {
      const dA = olas(-2600, 2600, nivel, 70, tt * 3.2, 60, 6200);
      agua.setAttribute("d", dA);
      aguaL.setAttribute("d", dA.replace(/^M[^L]*L/, "M").replace(/ L[-\\d.]+,6200 Z$/, ""));
    } else { agua.setAttribute("d", ""); aguaL.setAttribute("d", ""); }
    // Ola gigante: cruza la pantalla y rompe en «golpea»
    // x: la cresta (x local ≈ 1300) llega al centro de la pantalla justo en «golpea»; luego la ola se hunde en el agua
    const ux = clamp(tt / T.golpea, 0, 1);
    const xo = -1250 + 490 * Math.pow(ux, 0.85) + 320 * entre(tt, T.golpea, T.golpea + 0.5);
    const hunde = Math.pow(entre(tt, T.golpea - 0.05, T.golpea + 0.7), 1.6);
    const yo = 620 - 80 * Math.sin(ux * Math.PI * 0.9) + 1050 * hunde;
    if (hunde < 1) { ola.setAttribute("opacity", 1); ola.setAttribute("transform", "translate(" + xo.toFixed(1) + "," + yo.toFixed(1) + ") scale(1," + (1 - 0.35 * hunde).toFixed(3) + ")"); }
    else ola.setAttribute("opacity", 0);
    // Charco que queda abajo tras el golpe
    const nc = 1600 - 150 * suave(entre(tt, T.golpea, T.golpea + 0.6)) - 20 * Math.sin(tt * 1.3);
    const dC = olas(-40, 1120, nc, 12, tt * 4.1, 40, 1960);
    charco.setAttribute("d", dC); charcoL.setAttribute("d", dC.replace(/^M[^L]*L/, "M").replace(/ L[-\\d.]+,1960 Z$/, ""));
    // Gotas del golpe
    const dg = tt - T.golpea;
    gotas.forEach((g, i) => {
      const G = GOTAS[i];
      if (dg < 0 || dg > 1.0) { g.setAttribute("opacity", 0); return; }
      g.setAttribute("cx", (G.x0 + G.vx * dg).toFixed(1)); g.setAttribute("cy", (1380 + G.vy * dg + 2600 * dg * dg).toFixed(1));
      g.setAttribute("opacity", (0.9 * (1 - dg)).toFixed(2));
    });
    // Lluvia (pantalla); se calma cuando empieza a hablar de los datos
    const lluviaK = 1 - suave(entre(tt, T.tres, T.tres + 0.8));
    lluvia.forEach((l, i) => {
      const g = LLUVIA[i], y = ((g.y + g.v * tt) % 2300) - 160, x = g.x + y * 0.21;
      l.setAttribute("transform", "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")");
      l.style.opacity = lluviaK;
    });
    // Ruta-río: se dibuja mientras la cámara viaja de una parada a la siguiente
    for (const r of ruta) { const off = (r.L * (1 - suave(entre(tt, r.t0, r.t1)))).toFixed(1); r.a.style.strokeDashoffset = off; r.b.style.strokeDashoffset = off; r.a.setAttribute("stroke-width", (8 / z).toFixed(2)); r.b.setAttribute("stroke-width", (24 / z).toFixed(2)); }
    // Cuba: el mar sube alrededor de la isla (anillo de oleaje que late)
    const ol = suave(entre(tt, T.amenaza - 0.1, T.mar + 0.25)) * (1 - suave(entre(tt, T.salCuba, T.salCuba + 1.2)));
    oleaje.setAttribute("stroke-width", (ol * (40 + 8 * Math.sin(tt * 5))).toFixed(1));
    oleaje2.setAttribute("stroke-width", (ol * (78 + 14 * Math.sin(tt * 3.4 + 1))).toFixed(1));
    // Uruguay: «también se inunda» (sube y baja)
    const bu = BB.URY, ku = suave(entre(tt, T.tambien, T.inunda + 0.35)) * (1 - suave(entre(tt, T.pero2, T.pero2 + 0.8)));
    aguaURY.setAttribute("d", ku > 0.001 ? olas(bu[0] - 20, bu[2] + 20, bu[3] - (bu[3] - bu[1]) * 0.42 * ku, 6, tt * 4, 8, bu[3] + 20) : "");
    // Haití: el agua sube con «vulnerabilidad» y se queda
    const bh = BB.HTI, kh = suave(entre(tt, T.vulnerabilidad - 0.1, T.ocho + 0.2));
    aguaHTI.setAttribute("d", kh > 0.001 ? olas(bh[0] - 20, bh[2] + 20, bh[3] - (bh[3] - bh[1]) * 0.55 * kh, 3, tt * 4, 4, bh[3] + 20) : "");
    olaHTI.setAttribute("d", kh > 0.001 ? olas(620, 920, 975 - 120 * kh, 7, tt * 5, 12, 980) : "");
    // Personajes
    for (const p of PERSONAJES) aplicaPersonaje(p, tt);
  }
  const tl = gsap.timeline({ paused: true });
  const reloj = { t: 0 };
  tl.to(reloj, { t: D, duration: D, ease: "none", onUpdate: () => render(reloj.t) }, 0);
  ${TW.join("\n  ")}
  window.addEventListener("hf-seek", (e) => render(e.detail.time));
  render(0);
  window.__timelines["mundo"] = tl;
})();
</script>
</template>
`;

const subsHTML = `<template id="subtitulos-template">
<style>
  #root { position: absolute; inset: 0; pointer-events: none; }
  .grupo { position: absolute; left: 60px; right: 60px; top: 250px; text-align: center; font-family: ${FUENTE}; font-weight: 900;
    font-size: 70px; line-height: 1.12; letter-spacing: -0.02em; color: #fff; opacity: 0;
    text-shadow: 0 4px 0 rgba(0,0,0,0.55), 0 0 24px rgba(0,0,0,0.6); }
  .pal { display: inline-block; }
  .clave { color: ${C.tinta}; background: var(--c); padding: 0 16px; border-radius: 16px; text-shadow: none; margin: 0 4px; }
</style>
<div id="root" data-composition-id="subtitulos" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
  ${htmlSubs}
</div>
<script>
  (function () {
    const tl = gsap.timeline({ paused: true });
    ${twSubs.join("\n    ")}
    window.__timelines["subtitulos"] = tl;
  })();
</script>
</template>
`;

const carriles = [];
SFX.sort((a, b) => a.inicio - b.inicio).forEach((s) => {
  let c = carriles.findIndex((finC) => finC <= s.inicio);
  if (c < 0) { carriles.push(0); c = carriles.length - 1; }
  carriles[c] = s.inicio + s.dur; s.carril = 4 + c;
});
// Música de fondo (Mixkit «Cyberpunk City»): desde su segundo 50 para que su tramo más fuerte caiga en el clímax.
const MUSICA = { archivo: "cyberpunk-city-mixkit-846.mp3", desde: 50, volumen: 0.11 };
const sfxHTML = SFX.map((s, i) => `      <audio id="sfx${i}" class="clip" src="assets/sfx/${s.archivo}" data-start="${s.inicio}" data-duration="${s.dur}" data-track-index="${s.carril}" data-volume="${s.vol}"></audio>`).join("\n");
const indexHTML = `<!doctype html>
<html lang="es" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>¿Qué país de Latinoamérica aguanta una inundación?</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${C.fondo}; }
      #root { position: relative; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <!-- Generado por tools/generar.mjs: no lo edites a mano, cambia el generador y vuelve a ejecutarlo. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}" data-fps="${FPS}">
      <div id="mundo" data-composition-id="mundo" data-composition-src="compositions/mundo.html" data-start="0" data-duration="${D}" data-track-index="0" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>
      <div id="subtitulos" data-composition-id="subtitulos" data-composition-src="compositions/subtitulos.html" data-start="0" data-duration="${D}" data-track-index="1" data-track-kind="captions" data-width="${W}" data-height="${H}"></div>
      <audio id="voz" class="clip" src="assets/audio/voz.wav" data-start="0" data-duration="${D}" data-track-index="2" data-volume="1"></audio>
      <audio id="musica" class="clip" src="assets/musica/${MUSICA.archivo}" data-start="0" data-duration="${D}" data-media-start="${MUSICA.desde}" data-track-index="3" data-volume="${MUSICA.volumen}" data-fade-in="0.4" data-fade-out="1.2" data-timeline-role="music"></audio>
${sfxHTML}
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;

fs.mkdirSync(path.join(RAIZ, "compositions"), { recursive: true });
fs.writeFileSync(path.join(RAIZ, "compositions/mundo.html"), mundoHTML);
fs.writeFileSync(path.join(RAIZ, "compositions/subtitulos.html"), subsHTML);
// Con --sin-subtitulos se escribe la misma composición sin el carril de subtítulos (para video-SIN-SUBTITULOS.mp4).
const SIN_SUBS = process.argv.includes("--sin-subtitulos");
fs.writeFileSync(path.join(RAIZ, "index.html"), SIN_SUBS ? indexHTML.replace(/\s*<div id="subtitulos"[^>]*><\/div>/, "") : indexHTML);
fs.writeFileSync(path.join(RAIZ, "datos/mezcla.json"), JSON.stringify({ duracion: D, voz: { archivo: "assets/audio/voz.wav", volumen: 1 }, musica: { archivo: "assets/musica/" + MUSICA.archivo, desde: MUSICA.desde, volumen: MUSICA.volumen, fundidoEntrada: 0.4, fundidoSalida: 1.2 }, efectos: SFX.map(({ archivo, inicio, dur, vol }) => ({ archivo: "assets/sfx/" + archivo, inicio, dur, vol })) }, null, 1));
fs.writeFileSync(path.join(RAIZ, "datos/tiempos-palabras.json"), JSON.stringify(TV.palabras.map(({ texto, inicio, fin, frase }) => ({ texto, inicio, fin, frase })), null, 1));
console.log(`OK${SIN_SUBS ? " (SIN SUBTÍTULOS)" : ""} · duración ${D} s · ${N} fotogramas · ${grupos.length} grupos de subtítulos · ${SFX.length} efectos · ${TW.length} animaciones`);
