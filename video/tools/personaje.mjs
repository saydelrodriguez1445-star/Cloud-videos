// Personajes 2D en SVG con articulaciones (caderas, rodillas, hombros, codos, cuello) y ojos que parpadean.
// svgPersonaje(id, estilo) → marcado SVG. Origen (0,0) = entre los pies. Mide ~460 unidades de alto.
// RIG_JS → código que se incrusta en la composición: mueve los personajes según su «guion de actuación».

const MUSLO = 88, ESPINILLA = 86, BRAZO = 74, ANTEBRAZO = 70;
const CADERA_Y = -(MUSLO + ESPINILLA) + 4; // -170
const HOMBRO_Y = -318, CUELLO_Y = -336, CABEZA_Y = -398, R_CABEZA = 60;

export function svgPersonaje(id, e) {
  const {
    piel = "#c98d63", pelo = "#2a1a12", ropa = "#ffcc00", ropa2 = "#e0a800", pantalon = "#22324a",
    zapatos = "#1f6feb", tipo = "capucha", // capucha | gorra | pelo | coleta | rizos
    gorra = "#e5484d",
  } = e;
  const linea = "#0b0f14";
  const pierna = (lado) => `
    <g class="${id}-mus${lado}" transform="translate(${lado === "L" ? -22 : 22},${CADERA_Y})">
      <line x1="0" y1="0" x2="0" y2="${MUSLO}" stroke="${pantalon}" stroke-width="40" stroke-linecap="round"/>
      <g class="${id}-esp${lado}" transform="translate(0,${MUSLO})">
        <line x1="0" y1="0" x2="0" y2="${ESPINILLA - 10}" stroke="${pantalon}" stroke-width="36" stroke-linecap="round"/>
        <path d="M-20,${ESPINILLA - 34} h34 a8,8 0 0 1 8,8 v18 h18 a10,10 0 0 1 10,10 v4 h-78 a6,6 0 0 1 -6,-6 v-26 a8,8 0 0 1 8,-8z" fill="${zapatos}" stroke="${linea}" stroke-width="5"/>
      </g>
    </g>`;
  const brazo = (lado) => `
    <g class="${id}-bra${lado}" transform="translate(${lado === "L" ? -52 : 52},${HOMBRO_Y})">
      <line x1="0" y1="0" x2="0" y2="${BRAZO}" stroke="${ropa}" stroke-width="34" stroke-linecap="round"/>
      <g class="${id}-ant${lado}" transform="translate(0,${BRAZO})">
        <line x1="0" y1="0" x2="0" y2="${ANTEBRAZO - 6}" stroke="${ropa}" stroke-width="30" stroke-linecap="round"/>
        <circle class="${id}-mano${lado}" cx="0" cy="${ANTEBRAZO + 6}" r="17" fill="${piel}" stroke="${linea}" stroke-width="5"/>
      </g>
    </g>`;
  const cabeza = () => {
    const ojos = `
      <g class="${id}-ojos">
        <g class="${id}-ojo" transform="translate(-21,-6)"><ellipse rx="11" ry="14" fill="#fff"/><circle class="${id}-pup" cx="2" cy="1" r="6.5" fill="${linea}"/></g>
        <g class="${id}-ojo" transform="translate(21,-6)"><ellipse rx="11" ry="14" fill="#fff"/><circle class="${id}-pup" cx="2" cy="1" r="6.5" fill="${linea}"/></g>
      </g>
      <path class="${id}-cejas" d="M-34,-28 q12,-7 24,-2 M10,-30 q12,-5 24,2" stroke="${linea}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path class="${id}-boca-n" d="M-12,22 q12,9 24,0" stroke="${linea}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse class="${id}-boca-o" cx="0" cy="24" rx="9" ry="12" fill="${linea}" opacity="0"/>
      <path class="${id}-boca-s" d="M-18,16 q18,22 36,0 z" fill="${linea}" opacity="0"/>`;
    let pelo_ = "", detras = "";
    if (tipo === "capucha") {
      detras = `<path d="M-74,10 q-6,-92 74,-96 q80,4 74,96 q-2,30 -16,44 h-116 q-14,-14 -16,-44z" fill="${ropa}" stroke="${linea}" stroke-width="6"/>`;
      pelo_ = `<path d="M-50,-30 q50,-40 100,0 q-10,-34 -50,-36 q-40,2 -50,36z" fill="${pelo}"/>`;
    } else if (tipo === "gorra") {
      pelo_ = `<path d="M-58,-14 q-4,-56 58,-58 q62,2 58,58 z" fill="${gorra}" stroke="${linea}" stroke-width="6"/><path d="M20,-26 h66 a8,8 0 0 1 0,16 h-66z" fill="${gorra}" stroke="${linea}" stroke-width="6"/>`;
    } else if (tipo === "coleta") {
      detras = `<path d="M44,-30 q60,10 40,90 q-14,-40 -40,-50z" fill="${pelo}" stroke="${linea}" stroke-width="5"/>`;
      pelo_ = `<path d="M-60,-6 q-6,-64 60,-64 q66,0 60,64 q-20,-34 -60,-38 q-40,4 -60,38z" fill="${pelo}" stroke="${linea}" stroke-width="5"/>`;
    } else if (tipo === "rizos") {
      pelo_ = [[-46, -40], [-22, -58], [6, -62], [32, -54], [52, -34], [-56, -14], [58, -10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="22" fill="${pelo}"/>`).join("");
    } else {
      pelo_ = `<path d="M-60,-4 q-8,-66 60,-66 q68,0 60,66 q-14,-26 -34,-30 q-26,10 -52,-4 q-20,8 -34,34z" fill="${pelo}" stroke="${linea}" stroke-width="5"/>`;
    }
    return `
    <g class="${id}-cab" transform="translate(0,${CUELLO_Y})">
      <g transform="translate(0,${CABEZA_Y - CUELLO_Y})">
        ${detras}
        <circle r="${R_CABEZA}" fill="${piel}" stroke="${linea}" stroke-width="6"/>
        ${pelo_}
        ${ojos}
      </g>
    </g>`;
  };
  const torso = tipo === "capucha"
    ? `<path d="M-62,${HOMBRO_Y - 10} q62,-24 124,0 l14,${-HOMBRO_Y + CADERA_Y + 40} q-76,22 -152,0z" fill="${ropa}" stroke="${linea}" stroke-width="6"/>
       <line x1="0" y1="${HOMBRO_Y + 6}" x2="0" y2="${CADERA_Y + 36}" stroke="${ropa2}" stroke-width="6"/>
       <circle cx="-14" cy="${HOMBRO_Y + 50}" r="5" fill="${ropa2}"/><circle cx="-14" cy="${HOMBRO_Y + 100}" r="5" fill="${ropa2}"/>`
    : `<path d="M-58,${HOMBRO_Y - 8} q58,-22 116,0 l6,${-HOMBRO_Y + CADERA_Y + 8} q-64,16 -128,0z" fill="${ropa}" stroke="${linea}" stroke-width="6"/>
       <path d="M-62,${CADERA_Y - 2} h124" stroke="${ropa2}" stroke-width="14"/>`;
  return `
  <g id="${id}" class="pj">
    <ellipse class="${id}-sombra" cx="0" cy="4" rx="70" ry="12" fill="#000" opacity="0.35"/>
    <g class="${id}-cuerpo">
      ${brazo("L")}${pierna("L")}${pierna("R")}
      <g class="${id}-tronco">${torso}</g>
      ${cabeza()}
      ${brazo("R")}
    </g>
  </g>`;
}

// Código de rig que se incrusta en la composición. Todo es función del tiempo t (determinista).
export const RIG_JS = String.raw`
const POSES = {
  // Grados. Positivo = hacia delante (hacia donde mira el personaje); 180 = brazo hacia arriba.
  // m = muslo, e = flexión de rodilla, b = brazo, a = flexión de codo, cab = cabeza (negativo = mira arriba),
  // incl = inclinación del tronco (negativo = hacia atrás), agach = cuánto baja el cuerpo.
  quieto:  { mL: 3, eL: 4, mR: -3, eR: 4, bL: 8, aL: 12, bR: -6, aR: 10, cab: 0, incl: 0, agach: 0, ojoY: 0, boca: "n" },
  frena:   { mL: 30, eL: 8, mR: -18, eR: 34, bL: 70, aL: 20, bR: 60, aR: 30, cab: 6, incl: -12, agach: 20, ojoY: 0, boca: "o" },
  agacha:  { mL: 34, eL: 60, mR: -8, eR: 56, bL: 150, aL: 70, bR: 160, aR: 60, cab: 8, incl: 8, agach: 40, ojoY: 2, boca: "o" },
  mira:    { mL: 3, eL: 4, mR: -3, eR: 4, bL: 10, aL: 14, bR: -8, aR: 12, cab: -16, incl: -4, agach: 0, ojoY: -5, boca: "n" },
  rasca:   { mL: 3, eL: 4, mR: -3, eR: 4, bL: 10, aL: 14, bR: 168, aR: 100, cab: -10, incl: -2, agach: 0, ojoY: -5, boca: "n" },
  senala:  { mL: 6, eL: 4, mR: -6, eR: 4, bL: 10, aL: 14, bR: 112, aR: 4, cab: -10, incl: -2, agach: 0, ojoY: -4, boca: "s" },
  senalaAbajo: { mL: 6, eL: 4, mR: -6, eR: 4, bL: 10, aL: 14, bR: 62, aR: 2, cab: 8, incl: 3, agach: 0, ojoY: 3, boca: "s" },
  saluda:  { mL: 3, eL: 4, mR: -3, eR: 4, bL: 8, aL: 12, bR: 150, aR: 30, cab: -4, incl: 0, agach: 0, ojoY: 0, boca: "s" },
  pulgar:  { mL: 3, eL: 4, mR: -3, eR: 4, bL: 8, aL: 12, bR: 60, aR: 100, cab: -4, incl: 0, agach: 0, ojoY: 0, boca: "s" },
  miedo:   { mL: 16, eL: 30, mR: -12, eR: 30, bL: 120, aL: 110, bR: 125, aR: 105, cab: 8, incl: -6, agach: 18, ojoY: 2, boca: "o" },
  celebra: { mL: 4, eL: 4, mR: -4, eR: 4, bL: 165, aL: 12, bR: 168, aR: 10, cab: -10, incl: -2, agach: 0, ojoY: -4, boca: "s" },
  atras:   { mL: 18, eL: 10, mR: -22, eR: 8, bL: -35, aL: 40, bR: -30, aR: 45, cab: 8, incl: -10, agach: 6, ojoY: 2, boca: "o" },
};
const CICLOS = { anda: { f: 1.9, amp: 26, braz: 26, bote: 6 }, corre: { f: 2.9, amp: 44, braz: 60, bote: 14 } };
const suave = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
function mezcla(a, b, k) { const o = {}; for (const key in a) o[key] = typeof a[key] === "number" ? a[key] + (b[key] - a[key]) * k : (k < 0.5 ? a[key] : b[key]); return o; }
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

// guion: [{ t, a: "quieto"|"corre"|..., x, y, s, giro (1 o -1), dur (s que tarda en llegar a x,y) }]
function estadoPersonaje(p, t) {
  const g = p.guion;
  let k = 0; while (k + 1 < g.length && g[k + 1].t <= t) k++;
  const cur = g[k], prev = g[Math.max(0, k - 1)];
  // posición: de la posición anterior a la nueva en «dur» segundos (easing suave)
  const pos = (campo, def) => {
    let v = g[0][campo] ?? def;
    for (let i = 1; i <= k; i++) {
      const gi = g[i]; if (gi[campo] === undefined) continue;
      const desde = v, u = gi.dur ? suave((t - gi.t) / gi.dur) : 1;
      v = desde + (gi[campo] - desde) * (gi.lineal ? Math.min(1, Math.max(0, (t - gi.t) / gi.dur)) : u);
    }
    return v;
  };
  const x = pos("x", 0), y = pos("y", 0), s = pos("s", 1);
  let giro = 1; for (let i = 0; i <= k; i++) if (g[i].giro) giro = g[i].giro;
  const nombre = (q) => (POSES[q.a] ? q.a : "quieto");
  const k01 = suave((t - cur.t) / 0.22);
  let base = mezcla(POSES[nombre(prev)], POSES[nombre(cur)], k === 0 ? 1 : k01);
  const ciclo = CICLOS[cur.a];
  const ciclo0 = CICLOS[prev.a];
  const fase = (t - (p.fase0 || 0)) * Math.PI * 2;
  const aplica = (c, w) => {
    if (!c || w <= 0) return;
    const s1 = Math.sin(fase * c.f), c1 = Math.cos(fase * c.f);
    base.mL += c.amp * s1 * w; base.mR -= c.amp * s1 * w;
    base.eL += (20 + c.amp * 0.8 * Math.max(0, -c1)) * w; base.eR += (20 + c.amp * 0.8 * Math.max(0, c1)) * w;
    base.bL -= c.braz * s1 * w; base.bR += c.braz * s1 * w;
    base.aL += (c === CICLOS.corre ? 75 : 25) * w; base.aR += (c === CICLOS.corre ? 75 : 25) * w;
    base.agach += (-Math.abs(Math.sin(fase * c.f)) * c.bote + c.bote * 0.5) * w;
    base.incl += (c === CICLOS.corre ? 9 : 3) * w;
  };
  aplica(ciclo, k === 0 ? 1 : k01);
  aplica(ciclo0, k === 0 ? 0 : 1 - k01);
  // vida: respiración y pequeño balanceo, desfasados por personaje
  const sem = p.semilla || 1;
  const resp = Math.sin(t * 2.1 + sem) ;
  base.agach += resp * 2.2; base.bL += resp * 2.5; base.bR -= Math.sin(t * 1.7 + sem * 2) * 2.5; base.cab += Math.sin(t * 0.9 + sem) * 2;
  // gesto «rasca» y «saluda»: el antebrazo oscila
  if (cur.a === "rasca") base.aR += Math.sin(t * 22) * 14 * k01;
  if (cur.a === "saluda") base.aR += Math.sin(t * 9) * 28 * k01;
  if (cur.a === "miedo") { base.bL += Math.sin(t * 40) * 3; base.bR += Math.sin(t * 43) * 3; }
  // parpadeo: cada 2,4–4 s, 0,13 s
  let parp = 1;
  let tb = hash(sem) * 2;
  for (let i = 0; i < 40 && tb < t + 1; i++) { if (t >= tb && t < tb + 0.13) parp = Math.max(0.08, Math.abs((t - tb) / 0.065 - 1)); tb += 2.4 + hash(sem + i) * 1.6; }
  return { x, y, s, giro, base, parp };
}

function aplicaPersonaje(p, t) {
  const E = estadoPersonaje(p, t), b = E.base, q = p.el;
  q.raiz.setAttribute("transform", "translate(" + E.x.toFixed(1) + "," + E.y.toFixed(1) + ") scale(" + (E.s * E.giro).toFixed(3) + "," + E.s.toFixed(3) + ")");
  q.cuerpo.setAttribute("transform", "translate(0," + b.agach.toFixed(1) + ") rotate(" + b.incl.toFixed(1) + ",0,-170)");
  const r = (el, base, ang) => el.setAttribute("transform", base + " rotate(" + (-ang).toFixed(1) + ")");
  r(q.musL, "translate(-22,-170)", b.mL); r(q.musR, "translate(22,-170)", b.mR);
  r(q.espL, "translate(0,88)", -Math.abs(b.eL)); r(q.espR, "translate(0,88)", -Math.abs(b.eR));
  r(q.braL, "translate(-52,-318)", b.bL); r(q.braR, "translate(52,-318)", b.bR);
  r(q.antL, "translate(0,74)", b.aL); r(q.antR, "translate(0,74)", b.aR);
  q.cab.setAttribute("transform", "translate(0,-336) rotate(" + b.cab.toFixed(1) + ")");
  q.ojos.setAttribute("transform", "translate(0," + b.ojoY.toFixed(1) + ")");
  for (const o of q.ojo) { const tr = o.getAttribute("data-t"); o.setAttribute("transform", tr + " scale(1," + E.parp.toFixed(2) + ")"); }
  q.bocaN.setAttribute("opacity", b.boca === "n" ? 1 : 0); q.bocaO.setAttribute("opacity", b.boca === "o" ? 1 : 0); q.bocaS.setAttribute("opacity", b.boca === "s" ? 1 : 0);
  q.sombra.setAttribute("rx", (70 - b.agach * 0.2).toFixed(1));
}

function preparaPersonaje(p) {
  const $ = (c) => document.querySelector("." + p.id + "-" + c);
  p.el = {
    raiz: document.getElementById(p.id), cuerpo: $("cuerpo"), sombra: $("sombra"),
    musL: $("musL"), musR: $("musR"), espL: $("espL"), espR: $("espR"),
    braL: $("braL"), braR: $("braR"), antL: $("antL"), antR: $("antR"), cab: $("cab"), ojos: $("ojos"),
    ojo: [...document.querySelectorAll("." + p.id + "-ojo")], bocaN: $("boca-n"), bocaO: $("boca-o"), bocaS: $("boca-s"),
  };
  for (const o of p.el.ojo) o.setAttribute("data-t", o.getAttribute("transform"));
}
`;
