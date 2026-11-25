// Contenido de cada parada del viaje. Todo se escribe en píxeles de pantalla «tal y como se ve desde la vista de
// la estación», y un grupo con la transformación inversa de esa vista lo coloca en el mundo. Así, al llegar la cámara,
// cada pieza queda exactamente donde se diseñó; al irse, se aleja con el mundo (no desaparece de golpe).
import { svgPersonaje } from "./personaje.mjs";

export function construirEstaciones(ctx) {
  const { t, sal, V, C, FUENTE, icono, dato, coma, tw, set, sfx, DATOS, TOP10 } = ctx;
  const out = { svg: "", personajes: [], defs: "" };
  const grupo = (id, v, contenido) =>
    `<g id="${id}" transform="translate(${(v.cx - 540 / v.z).toFixed(2)},${(v.cy - 960 / v.z).toFixed(2)}) scale(${(1 / v.z).toFixed(5)})">${contenido}</g>`;
  const txt = (x, y, s, { tam = 50, peso = 800, color = C.tinta, ancla = "start", id = "", extra = "" } = {}) =>
    `<text ${id ? `id="${id}"` : ""} x="${x}" y="${y}" font-family="${FUENTE}" font-weight="${peso}" font-size="${tam}" fill="${color}" text-anchor="${ancla}" ${extra}>${s}</text>`;
  const tarjeta = (id, x, y, w, h, interior) => `
    <g id="${id}" opacity="0">
      <rect x="${x}" y="${y + 14}" width="${w}" height="${h}" rx="34" fill="#000" opacity="0.35"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="34" fill="#fff"/>
      <g transform="translate(${x},${y})">${interior}</g>
    </g>`;
  // Número que gira como un rodillo: cada cifra es una columna 0–9 que da una vuelta y para en su valor.
  let nClip = 0;
  const rodillo = (id, valor, x, y, tam, color) => {
    const paso = tam * 1.08, ancho = tam * 0.64, coma_ = tam * 0.3;
    let cx = x, piezas = "", cols = [];
    for (const ch of valor) {
      if (/\d/.test(ch)) {
        const d = +ch, seq = [...Array(10).keys(), ...Array(d + 1).keys()];
        const cid = `${id}-c${cols.length}`, clip = `clip-rod-${nClip++}`;
        out.defs += `<clipPath id="${clip}"><rect x="${cx - 4}" y="${y - tam * 0.86}" width="${ancho + 8}" height="${tam * 1.04}"/></clipPath>`;
        piezas += `<g clip-path="url(#${clip})"><g id="${cid}">${seq.map((n, i) => txt(cx + ancho / 2, y + i * paso, n, { tam, peso: 900, color, ancla: "middle", extra: 'style="font-variant-numeric:tabular-nums"' })).join("")}</g></g>`;
        cols.push({ cid, pasos: seq.length - 1, paso });
        cx += ancho;
      } else {
        piezas += txt(cx + coma_ / 2, y, ch, { tam, peso: 900, color, ancla: "middle" });
        cx += ch === "," ? coma_ : tam * 0.5;
      }
    }
    return { svg: piezas, fin: cx, gira: (en, dur = 0.9) => cols.forEach((c, k) => tw(`#${c.cid}`, { y: 0 }, { y: -c.pasos * c.paso, duration: dur + k * 0.12, ease: "power3.out" }, en)) };
  };
  // Barra de 0 a 10 que se rellena.
  const barra = (id, x, y, w, valor, color) => `
    <rect x="${x}" y="${y}" width="${w}" height="22" rx="11" fill="#e6e9ee"/>
    <rect id="${id}" x="${x}" y="${y}" width="${(w * Math.max(valor, 0.25)) / 10}" height="22" rx="11" fill="${color}"/>`;
  const llenaBarra = (id, en, dur = 0.8) => tw(`#${id}`, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, transformOrigin: "0% 50%", duration: dur, ease: "power3.out" }, en);
  const aparece = (sel, en, de = { scale: 0.6 }) => tw(sel, { opacity: 0, ...de, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, y: 0, x: 0, transformOrigin: "50% 50%", duration: 0.42, ease: "back.out(1.7)" }, en);
  const pliega = (sel, en, origen = "50% 0%") => tw(sel, { scale: 1, opacity: 1, transformOrigin: origen }, { scale: 0.2, opacity: 0, transformOrigin: origen, duration: 0.3, ease: "power3.in" }, en);
  const etiqueta = (id, x, y, s, color = C.blanco) => `<g id="${id}" opacity="0">${txt(x, y, s, { tam: 64, peso: 900, color, extra: `stroke="${C.tinta}" stroke-width="14" paint-order="stroke" stroke-linejoin="round"` })}</g>`;
  // Tarjeta de dato: icono + etiqueta + número que rueda + barra.
  const tarjetaDato = (id, x, y, w, { icon, colorIcono, etiquetaTxt, valor, color, alto = 250, extra = "" }) => {
    const colorTxt = color === C.bueno ? C.buenoTxt : color === C.ambar ? C.ambarTxt : color;
    const r = rodillo(`${id}-num`, valor, 34, 186, 120, colorTxt);
    const svg = tarjeta(id, x, y, w, alto, `
      ${icono(icon, { tam: 60, color: colorIcono, grosor: 2.6, x: 30, y: 26 })}
      ${txt(108, 76, etiquetaTxt, { tam: 50, peso: 800 })}
      ${r.svg}
      ${txt(r.fin + 8, 186, "/10", { tam: 54, peso: 800, color: C.gris })}
      ${barra(`${id}-barra`, 34, 212, w - 68, parseFloat(valor.replace(",", ".")), color)}
      ${extra}`);
    return { svg, gira: r.gira, barra: `${id}-barra` };
  };

  // ───────────── CUBA (#4) ─────────────
  {
    const rios = tarjetaDato("cub-rios", 60, 1000, 460, { icon: "waves", colorIcono: C.agua, etiquetaTxt: "Ríos", valor: coma(dato("CUB").rio.toFixed(1)), color: C.bueno });
    const costa = tarjetaDato("cub-costa", 560, 1000, 460, { icon: "waves", colorIcono: C.malo, etiquetaTxt: "Costa", valor: coma(dato("CUB").costa.toFixed(1)), color: C.malo });
    out.svg += grupo("est-cub", V.cuba, `
      ${etiqueta("cub-nombre", 110, 600, "CUBA")}
      <g id="cub-tarjetas">${rios.svg}${costa.svg}</g>
      ${svgPersonaje("vc", { tipo: "gorra", ropa: "#2b5ccf", ropa2: "#ffffff", gorra: "#e5484d", piel: "#8d5a3b", pelo: "#1c120c", pantalon: "#1d2a40", zapatos: "#f5f5f5" })}`);
    out.personajes.push({ id: "vc", semilla: 5, guion: [
      { t: 0, a: "quieto", x: 790, y: 852, s: 0, giro: -1 },
      { t: t.cuatro, s: 0.56, dur: 0.35 },
      { t: t.cuba, a: "saluda" },
      { t: t.rios1, a: "quieto" },
      { t: t.minimo, a: "pulgar" },
      { t: t.amenaza, a: "mira" },
      { t: t.mar, a: "atras" },
      { t: t.mar + 0.45, a: "miedo" },
      { t: sal.cuba + 0.1, a: "quieto", s: 0, dur: 0.35 },
    ] });
    aparece("#cub-nombre", t.cuba - 0.05, { x: -30, scale: 0.8 });
    aparece("#cub-rios", t.rios1 - 0.05, { y: 60, scale: 0.85 });
    rios.gira(t.rios1 + 0.05, (t.minimo - t.rios1) + 0.1);
    llenaBarra(rios.barra, t.minimo, 0.6);
    tw("#cub-rios-num-c1", { scale: 1, transformOrigin: "50% 50%" }, { scale: 1.12, transformOrigin: "50% 50%", duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" }, t.medio);
    aparece("#cub-costa", t.amenaza - 0.05, { y: 60, scale: 0.85 });
    costa.gira(t.amenaza + 0.05, (t.mar - t.amenaza) + 0.15);
    llenaBarra(costa.barra, t.mar, 0.6);
    pliega("#cub-tarjetas", sal.cuba);
    pliega("#cub-nombre", sal.cuba, "0% 50%");
    sfx("pop.mp3", t.rios1 + 0.05, 0.28);
    sfx("click-soft.mp3", t.minimo + 0.15, 0.35);
    sfx("pop.mp3", t.amenaza + 0.05, 0.26);
    sfx("whoosh-short.mp3", t.mar - 0.05, 0.32);
  }

  // ───────────── COSTA RICA (#3) ─────────────
  {
    const d = dato("CRI");
    const resp = tarjetaDato("cri-resp", 60, 1040, 960, {
      icon: "siren", colorIcono: C.malo, etiquetaTxt: "Falta de respuesta", valor: coma(d.falta_respuesta.toFixed(1)), color: C.bueno, alto: 330,
      extra: `<g id="cri-tag" opacity="0"><rect x="34" y="254" width="640" height="62" rx="31" fill="${C.bueno}"/>${txt(354, 300, "La más baja de la región", { tam: 46, peso: 800, color: C.tinta, ancla: "middle" })}</g>`,
    });
    // Camioneta de rescate (formas SVG) con luces que parpadean.
    const camioneta = `
      <g id="cri-camion" transform="translate(-420,0)" opacity="0">
        <g transform="translate(0,836)">
          <rect x="0" y="40" width="250" height="110" rx="18" fill="#ffffff" stroke="${C.tinta}" stroke-width="6"/>
          <path d="M250,70 h70 l48,40 v40 h-118z" fill="#ffffff" stroke="${C.tinta}" stroke-width="6" stroke-linejoin="round"/>
          <path d="M268,82 h48 l30,28 h-78z" fill="#9fd8ff" stroke="${C.tinta}" stroke-width="5"/>
          <rect x="0" y="92" width="250" height="20" fill="${C.malo}"/>
          <rect x="105" y="58" width="40" height="40" fill="${C.malo}"/><rect x="85" y="68" width="80" height="20" fill="${C.malo}"/>
          <rect id="cri-luz-a" x="40" y="22" width="44" height="20" rx="6" fill="${C.malo}"/>
          <rect id="cri-luz-b" x="168" y="22" width="44" height="20" rx="6" fill="${C.azul}"/>
          <g id="cri-rueda-a" transform="translate(70,152)"><circle r="30" fill="${C.tinta}"/><circle r="12" fill="#cfd8e3"/><rect x="-3" y="-26" width="6" height="52" fill="#cfd8e3"/></g>
          <g id="cri-rueda-b" transform="translate(300,152)"><circle r="30" fill="${C.tinta}"/><circle r="12" fill="#cfd8e3"/><rect x="-3" y="-26" width="6" height="52" fill="#cfd8e3"/></g>
        </g>
      </g>`;
    out.svg += grupo("est-cri", V.cr, `
      ${etiqueta("cri-nombre", 600, 560, "COSTA RICA")}
      ${camioneta}
      ${resp.svg}
      ${svgPersonaje("vt", { tipo: "coleta", ropa: "#e5484d", ropa2: "#ffffff", piel: "#e0b08a", pelo: "#5a3420", pantalon: "#22324a", zapatos: "#2f6bff" })}`);
    out.personajes.push({ id: "vt", semilla: 7, guion: [
      { t: 0, a: "quieto", x: 410, y: 965, s: 0, giro: 1 },
      { t: t.tres2, s: 0.6, dur: 0.35 },
      { t: t.costa, a: "saluda" },
      { t: t.pais3, a: "quieto" },
      { t: t.mejor2, a: "pulgar" },
      { t: t.emergencia + 0.5, a: "senala", giro: -1 },
      { t: t.region, a: "celebra", giro: 1 },
      { t: sal.cr + 0.1, a: "quieto", s: 0, dur: 0.35 },
    ] });
    aparece("#cri-nombre", t.costa - 0.05, { x: -30, scale: 0.8 });
    aparece("#cri-resp", t.responde2 - 0.05, { y: 60, scale: 0.85 });
    resp.gira(t.responde2 + 0.05, t.emergencia - t.responde2 + 0.1);
    llenaBarra(resp.barra, t.emergencia, 0.7);
    aparece("#cri-tag", t.region - 0.05, { scale: 0.7 });
    // La camioneta llega en «emergencia» y frena junto a la vecina.
    tw("#cri-camion", { x: -420, opacity: 1 }, { x: 40, opacity: 1, duration: 0.7, ease: "power3.out" }, t.emergencia - 0.15);
    pliega("#cri-camion", sal.cr, "50% 100%");
    tw("#cri-rueda-a", { rotation: 0, svgOrigin: "70 988" }, { rotation: 540, svgOrigin: "70 988", duration: 0.7, ease: "power3.out" }, t.emergencia - 0.15);
    tw("#cri-rueda-b", { rotation: 0, svgOrigin: "300 988" }, { rotation: 540, svgOrigin: "300 988", duration: 0.7, ease: "power3.out" }, t.emergencia - 0.15);
    const nDest = Math.max(1, Math.floor((sal.cr - t.emergencia) / 0.36));
    tw("#cri-luz-a", { opacity: 1 }, { opacity: 0.25, duration: 0.18, yoyo: true, repeat: nDest * 2 - 1, ease: "none" }, t.emergencia);
    tw("#cri-luz-b", { opacity: 0.25 }, { opacity: 1, duration: 0.18, yoyo: true, repeat: nDest * 2 - 1, ease: "none" }, t.emergencia);
    pliega("#cri-resp", sal.cr);
    pliega("#cri-nombre", sal.cr, "0% 50%");
    sfx("pop.mp3", t.responde2 + 0.05, 0.28);
    sfx("whoosh-short.mp3", t.emergencia + 0.1, 0.25);
    sfx("click-soft.mp3", t.emergencia + 0.2, 0.35);
    sfx("ping.mp3", t.region, 0.22);
  }

  // ───────────── CHILE (#2) ─────────────
  {
    const d = dato("CHL");
    const rios = tarjetaDato("chl-rios", 60, 1120, 580, { icon: "waves", colorIcono: C.agua, etiquetaTxt: "Ríos", valor: coma(d.rio.toFixed(1)), color: C.ambar });
    // Andes: picos a lo largo de la frontera este de Chile (en píxeles de la vista de Chile).
    const z = V.chile.z, aPant = (x, y) => [540 + (x - V.chile.cx) * z, 960 + (y - V.chile.cy) * z];
    const borde = [[470, 3250], [455, 3560], [400, 3880], [370, 4200], [345, 4520], [310, 4840], [285, 5150], [265, 5420]];
    const picos = borde.map(([x, y]) => aPant(x, y));
    const svgPicos = picos.map(([x, y], i) => {
      const h = 110 + ((i * 37) % 50), w = 96;
      return `<g id="chl-pico${i}" opacity="0"><path d="M${x - w / 2},${y + 10} L${x + 4},${y - h} L${x + w / 2 + 6},${y + 10} Z" fill="#7d8ea6" stroke="${C.tinta}" stroke-width="6" stroke-linejoin="round"/><path d="M${x - 15},${y - h + 34} L${x + 4},${y - h} L${x + 24},${y - h + 34} L${x + 12},${y - h + 26} L${x + 4},${y - h + 42} L${x - 4},${y - h + 28} Z" fill="#ffffff"/></g>`;
    }).join("");
    // Ríos que bajan de los picos al Pacífico.
    const svgRios = picos.filter((_, i) => i % 2 === 0).map(([x, y], i) => `<path id="chl-rio${i}" d="M${x - 20},${y} q-30,24 -62,30 t-64,34" fill="none" stroke="#3aa0ff" stroke-width="9" stroke-linecap="round" stroke-dasharray="160" stroke-dashoffset="160"/>`).join("");
    // Móviles por toda la silueta de Chile que se encienden con la alerta.
    const svgMoviles = picos.filter((_, i) => i % 2 === 1).map(([x, y], i) => `<g id="chl-movil${i}" opacity="0">${icono("smartphone", { tam: 62, color: C.blanco, grosor: 2.4, x: x - 108, y: y - 10 })}<circle cx="${x - 77}" cy="${y + 21}" r="12" fill="${C.malo}"/></g>`).join("");
    // Móvil grande con la alerta (réplica genérica, sin marcas oficiales).
    const movil = `
      <g id="chl-telefono" opacity="0">
        <rect x="64" y="494" width="400" height="600" rx="56" fill="#000" opacity="0.35"/>
        <rect x="60" y="480" width="400" height="600" rx="56" fill="#121820" stroke="#3a4757" stroke-width="6"/>
        <rect x="80" y="502" width="360" height="556" rx="38" fill="#1f2a37"/>
        <rect x="210" y="512" width="100" height="22" rx="11" fill="#000"/>
        <g id="chl-alerta" opacity="0">
          <rect x="94" y="556" width="332" height="480" rx="30" fill="#fff"/>
          <rect x="94" y="556" width="332" height="96" rx="30" fill="${C.malo}"/><rect x="94" y="616" width="332" height="36" fill="${C.malo}"/>
          ${icono("triangle-alert", { tam: 60, color: "#fff", grosor: 2.6, x: 114, y: 574 })}
          ${txt(188, 624, "ALERTA", { tam: 52, peso: 900, color: "#fff" })}
          ${txt(118, 722, "Emergencia", { tam: 46, peso: 800 })}
          ${txt(118, 796, "Ve a una", { tam: 46, peso: 700, color: C.gris })}
          ${txt(118, 852, "zona segura", { tam: 46, peso: 700, color: C.gris })}
          <rect x="118" y="910" width="284" height="84" rx="22" fill="${C.malo}"/>
          ${txt(260, 966, "OK", { tam: 46, peso: 900, color: "#fff", ancla: "middle" })}
        </g>
      </g>`;
    out.svg += grupo("est-chl", V.chile, `
      ${svgRios}${svgPicos}${svgMoviles}
      ${etiqueta("chl-nombre", 480, 640, "CHILE")}
      ${movil}
      ${rios.svg}
      ${svgPersonaje("vl", { tipo: "pelo", ropa: "#f1f5f9", ropa2: "#2f6bff", piel: "#c98d63", pelo: "#1c120c", pantalon: "#1d2a40", zapatos: "#e5484d" })}`);
    out.personajes.push({ id: "vl", semilla: 9, guion: [
      { t: 0, a: "quieto", x: 575, y: 1060, s: 0, giro: -1 },
      { t: t.dos1, s: 0.56, dur: 0.35 },
      { t: t.chile, a: "saluda" },
      { t: t.andes, a: "mira", giro: 1 },
      { t: t.fuerza, a: "atras" },
      { t: t.peligro, a: "miedo", giro: -1 },
      { t: t.alerta - 0.1, a: "senala", giro: -1 },
      { t: t.zona, a: "pulgar" },
      { t: sal.chile + 0.1, a: "quieto", s: 0, dur: 0.35 },
    ] });
    aparece("#chl-nombre", t.chile - 0.05, { x: -30, scale: 0.8 });
    picos.forEach((_, i) => tw(`#chl-pico${i}`, { opacity: 0, y: 40, scale: 0.4, transformOrigin: "50% 100%" }, { opacity: 1, y: 0, scale: 1, transformOrigin: "50% 100%", duration: 0.4, ease: "back.out(1.8)" }, t.andes - 0.15 + i * 0.03));
    picos.filter((_, i) => i % 2 === 0).forEach((_, i) => {
      const n = Math.max(1, Math.floor((t.pero1 - t.bajan) / 0.7));
      tw(`#chl-rio${i}`, { strokeDashoffset: 160 }, { strokeDashoffset: -160, duration: 0.7, repeat: n - 1, ease: "power1.in" }, t.bajan + i * 0.05);
    });
    aparece("#chl-rios", t.rios2 - 0.05, { y: 60, scale: 0.85 });
    rios.gira(t.rios2 + 0.05, t.andes - t.rios2 + 0.2);
    llenaBarra(rios.barra, t.andes, 0.7);
    tw("#chl-rios", { scale: 1, transformOrigin: "50% 50%" }, { scale: 1.06, transformOrigin: "50% 50%", duration: 0.14, yoyo: true, repeat: 1 }, t.fuerza);
    aparece("#chl-telefono", t.manda - 0.1, { y: 80, scale: 0.8 });
    aparece("#chl-alerta", t.alerta, { scale: 0.7 });
    tw("#chl-telefono", { rotation: 0, transformOrigin: "50% 50%" }, { rotation: 3, transformOrigin: "50% 50%", duration: 0.05, yoyo: true, repeat: 9, ease: "none" }, t.alerta);
    picos.filter((_, i) => i % 2 === 1).forEach((_, i) => tw(`#chl-movil${i}`, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, transformOrigin: "50% 50%", duration: 0.3, ease: "back.out(2)" }, t.todos + i * ((t.zona - t.todos) / 4)));
    picos.forEach((_, i) => pliega(`#chl-pico${i}`, sal.chile + 0.05, "50% 100%"));
    picos.filter((_, i) => i % 2 === 1).forEach((_, i) => pliega(`#chl-movil${i}`, sal.chile, "50% 50%"));
    pliega("#chl-rios", sal.chile);
    pliega("#chl-telefono", sal.chile);
    pliega("#chl-nombre", sal.chile, "0% 50%");
    sfx("pop.mp3", t.rios2 + 0.05, 0.28);
    sfx("whoosh-short.mp3", t.andes, 0.22);
    sfx("notification.mp3", t.alerta, 0.42);
    [0, 2].forEach((k) => sfx("pop.mp3", t.todos + k * ((t.zona - t.todos) / 4) + 0.1, 0.16));
  }

  // ───────────── URUGUAY (#1) · CLÍMAX ─────────────
  {
    const orden = [...DATOS].sort((a, b) => b.inform_riesgo_total - a.inform_riesgo_total);
    const x0 = 40, ancho = 880, slot = ancho / orden.length, hMax = 190, base = 400;
    const barras = orden.map((d, i) => {
      const h = (hMax * d.inform_riesgo_total) / 7.6, col = d.iso3 === "URY" ? C.bueno : d.iso3 === "HTI" ? C.malo : "#c6ced8";
      return `<rect id="uru-b${i}" x="${(x0 + i * slot + 6).toFixed(1)}" y="${(base - h).toFixed(1)}" width="${(slot - 12).toFixed(1)}" height="${h.toFixed(1)}" rx="8" fill="${col}"/>`;
    }).join("");
    const r = rodillo("uru-num", coma(dato("URY").inform_riesgo_total.toFixed(1)), 600, 188, 150, C.buenoTxt);
    const tarj = tarjeta("uru-tarjeta", 60, 920, 960, 480, `
      ${txt(40, 78, "Riesgo de desastre", { tam: 50, peso: 800 })}
      ${txt(40, 132, "20 países · INFORM", { tam: 46, peso: 700, color: C.gris })}
      <g id="uru-contador" opacity="0">${r.svg}
      ${txt(r.fin + 10, 188, "/10", { tam: 60, peso: 800, color: C.gris })}</g>
      <g id="uru-barras">${barras}</g>
      <line x1="${x0}" y1="${base + 2}" x2="${x0 + ancho}" y2="${base + 2}" stroke="#cfd5dd" stroke-width="4"/>
      ${txt(x0, base + 58, "Haití", { tam: 46, peso: 800, color: C.malo })}
      ${txt(x0 + ancho, base + 58, "Uruguay", { tam: 46, peso: 900, color: C.buenoTxt, ancla: "end" })}`);
    out.svg += grupo("est-uru", V.uru, `
      ${etiqueta("uru-nombre", 600, 570, "URUGUAY")}
      <g id="uru-corona" opacity="0">${icono("crown", { tam: 104, color: "#ffd23f", grosor: 2.6, x: 464, y: 392 })}</g>
      ${tarj}
      ${svgPersonaje("vu", { tipo: "rizos", ropa: "#7cc4ff", ropa2: "#ffffff", piel: "#6b4128", pelo: "#1c120c", pantalon: "#22324a", zapatos: "#ffffff" })}`);
    out.personajes.push({ id: "vu", semilla: 11, guion: [
      { t: 0, a: "quieto", x: 700, y: 880, s: 0, giro: -1 },
      { t: t.uno, s: 0.55, dur: 0.35 },
      { t: t.uruguay, a: "celebra" },
      { t: t.inunda - 0.1, a: "miedo" },
      { t: t.pero2, a: "quieto" },
      { t: t.bajo, a: "pulgar" },
      { t: t.dos2, a: "celebra" },
      { t: sal.uru + 0.1, a: "quieto", s: 0, dur: 0.35 },
    ] });
    aparece("#uru-nombre", t.uruguay - 0.05, { x: -30, scale: 0.8 });
    tw("#uru-corona", { opacity: 0, y: -80, scale: 0.4, transformOrigin: "50% 100%" }, { opacity: 1, y: 0, scale: 1, transformOrigin: "50% 100%", duration: 0.5, ease: "bounce.out" }, t.uruguay);
    aparece("#uru-tarjeta", t.pero2, { y: 80, scale: 0.85 });
    orden.forEach((_, i) => tw(`#uru-b${i}`, { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, transformOrigin: "50% 100%", duration: 0.3, ease: "power3.out" }, t.riesgo2 + (i * (t.bajo - 0.4 - t.riesgo2)) / orden.length));
    tw(`#uru-b${orden.length - 1}`, { scale: 1, transformOrigin: "50% 100%" }, { scale: 1.25, transformOrigin: "50% 100%", duration: 0.18, yoyo: true, repeat: 1 }, t.bajo);
    // El «2,5» entra justo cuando la voz dice «dos» y gira hasta su valor antes de «cinco».
    aparece("#uru-contador", t.dos2 - 0.02, { scale: 0.6 });
    r.gira(t.dos2, 0.4);
    pliega("#uru-tarjeta", sal.uru);
    pliega("#uru-nombre", sal.uru, "0% 50%");
    tw("#uru-corona", { opacity: 1, scale: 1, transformOrigin: "50% 100%" }, { opacity: 0, scale: 0.3, transformOrigin: "50% 100%", duration: 0.3, ease: "power3.in" }, sal.uru);
    sfx("ping.mp3", t.uruguay, 0.32);
    sfx("pop.mp3", t.pero2 + 0.05, 0.28);
    sfx("riser.mp3", t.dos2 - 0.05, 0.26, 3.55);
    sfx("impact-bass-1.mp3", t.dos2 + 0.1, 0.6);
  }

  // ───────────── HAITÍ (el que peor lo pasaría) ─────────────
  {
    const vul = tarjetaDato("hti-vul", 60, 1050, 960, { icon: "users", colorIcono: C.ambar, etiquetaTxt: "Vulnerabilidad", valor: coma(dato("HTI").fragilidad.toFixed(1)), color: C.malo });
    out.svg += grupo("est-hti", V.haiti, `
      ${etiqueta("hti-nombre", 660, 520, "HAITÍ")}
      <g id="hti-agua-frente" clip-path="url(#clip-hti-frente)"><path id="hti-ola-frente" d="" fill="#2f8cff" opacity="0.85"/></g>
      ${vul.svg}`);
    out.defs += `<clipPath id="clip-hti-frente"><rect x="640" y="560" width="260" height="400"/></clipPath>`;
    // El vecino de Haití va antes que el agua de delante: el agua le llega a las rodillas.
    out.svg = out.svg.replace(`<g id="hti-agua-frente"`, `${svgPersonaje("vh", { tipo: "gorra", gorra: "#1f3a8a", ropa: "#d4202c", ropa2: "#1f3a8a", piel: "#5a3825", pelo: "#1c120c", pantalon: "#22324a", zapatos: "#f5f5f5" })}<g id="hti-agua-frente"`);
    out.personajes.push({ id: "vh", semilla: 13, guion: [
      { t: 0, a: "quieto", x: 770, y: 905, s: 0, giro: -1 },
      { t: t.haiti, s: 0.6, dur: 0.35 },
      { t: t.haiti + 0.3, a: "mira" },
      { t: t.vulnerabilidad, a: "miedo" },
      { t: t.decimo, a: "atras" },
      { t: t.mundo, a: "miedo" },
      { t: sal.haiti2 + 0.1, s: 0, dur: 0.35 },
    ] });
    // Lista mundial (en la vista alejada de Haití).
    const filas = TOP10.map((d, i) => {
      const yy = i * 92, rojo = d.iso3 === "HTI";
      return `<g transform="translate(0,${yy})">${rojo ? `<rect x="-10" y="-62" width="900" height="84" rx="20" fill="${C.malo}"/>` : ""}
        ${txt(30, 0, d.puesto, { tam: 52, peso: 900, color: rojo ? "#fff" : C.gris })}
        ${txt(130, 0, d.nombre, { tam: 52, peso: 800, color: rojo ? "#fff" : C.tinta })}
        ${txt(870, 0, coma(d.riesgo.toFixed(1)), { tam: 52, peso: 900, color: rojo ? "#fff" : C.tinta, ancla: "end" })}</g>`;
    }).join("");
    const iHaiti = TOP10.findIndex((d) => d.iso3 === "HTI");
    const ventanaY = 1040, ventanaH = 330, filaCentro = ventanaY + ventanaH / 2 + 18;
    out.defs += `<linearGradient id="g-desvanece" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="clip-lista"><rect x="60" y="${ventanaY}" width="960" height="${ventanaH}"/></clipPath>`;
    out.svg += grupo("est-hti2", V.haiti2, `
      <g id="hti-lista" opacity="0">
        <rect x="60" y="${880 + 14}" width="960" height="520" rx="34" fill="#000" opacity="0.35"/>
        <rect x="60" y="880" width="960" height="520" rx="34" fill="#fff"/>
        ${icono("globe", { tam: 60, color: C.azul, grosor: 2.6, x: 92, y: 912 })}
        ${txt(170, 962, "Más riesgo del mundo", { tam: 50, peso: 800 })}
        ${txt(92, 1022, "INFORM · 191 países", { tam: 46, peso: 700, color: C.gris })}
        <g clip-path="url(#clip-lista)"><g id="hti-filas" transform="translate(100,0)"><g id="hti-filas-in">${filas}</g></g></g>
        <rect x="60" y="${ventanaY}" width="960" height="46" fill="url(#g-desvanece)"/>
      </g>`);
    const yIni = ventanaY + 70, yFin = filaCentro - iHaiti * 92;
    tw("#hti-filas-in", { y: yIni }, { y: yFin, duration: t.mundo - t.decimo + 0.25, ease: "power3.inOut" }, t.decimo - 0.1);
    aparece("#hti-nombre", t.haiti, { x: -30, scale: 0.8 });
    aparece("#hti-vul", t.vulnerabilidad - 0.05, { y: 60, scale: 0.85 });
    vul.gira(t.vulnerabilidad + 0.1, t.ocho - t.vulnerabilidad + 0.1);
    llenaBarra(vul.barra, t.ocho, 0.7);
    aparece("#hti-lista", sal.haiti1 + 0.1, { y: 80, scale: 0.85 });
    pliega("#hti-lista", sal.haiti2);
    pliega("#hti-vul", sal.haiti1);
    pliega("#hti-nombre", sal.haiti1, "0% 50%");
    sfx("pop.mp3", t.vulnerabilidad + 0.05, 0.26);
    sfx("click-soft.mp3", t.ocho + 0.2, 0.35);
    sfx("typing.mp3", t.decimo, 0.22, 1.2);
    sfx("ping.mp3", t.mundo, 0.3);
  }
  return out;
}
