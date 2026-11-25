// Proyecta los países de Latinoamérica (Natural Earth, world-atlas 50m) a trazados SVG en coordenadas del mundo.
import fs from "node:fs";
import { createRequire } from "node:module";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
const require = createRequire(import.meta.url);
const topo = require("world-atlas/countries-50m.json");

// ISO 3166-1 numérico → ISO3 de los países que pintamos.
export const NUM2ISO = {
  "032": "ARG", "068": "BOL", "076": "BRA", "152": "CHL", "170": "COL", "188": "CRI", "192": "CUB", "214": "DOM",
  "218": "ECU", "222": "SLV", "320": "GTM", "332": "HTI", "340": "HND", "484": "MEX", "558": "NIC", "591": "PAN",
  "600": "PRY", "604": "PER", "858": "URY", "862": "VEN", "328": "GUY", "740": "SUR", "084": "BLZ", "388": "JAM",
  "044": "BHS", "630": "PRI", "780": "TTO",
};

// Quita las islas lejanas (Isla de Pascua, Galápagos, Juan Fernández…) para que la silueta se lea limpia.
function limpia(f, proj, margen) {
  const g = f.geometry;
  if (g.type !== "MultiPolygon") return f;
  const p = geoPath(proj);
  const polys = g.coordinates.map((c) => ({ c, area: p.area({ type: "Polygon", coordinates: c }), b: p.bounds({ type: "Polygon", coordinates: c }) }));
  const mayor = polys.reduce((a, b) => (b.area > a.area ? b : a));
  const [[X0, Y0], [X1, Y1]] = mayor.b;
  const cerca = (b) => b[1][0] > X0 - margen && b[0][0] < X1 + margen && b[1][1] > Y0 - margen && b[0][1] < Y1 + margen;
  return { ...f, geometry: { type: "MultiPolygon", coordinates: polys.filter((q) => q === mayor || cerca(q.b)).map((q) => q.c) } };
}

export function construirMapa({ alto = 6000 } = {}) {
  const fc = feature(topo, topo.objects.countries);
  let feats = fc.features.filter((f) => NUM2ISO[String(f.id).padStart(3, "0")]);
  const pre = geoMercator().rotate([75, 0]).fitHeight(alto, { type: "FeatureCollection", features: feats });
  feats = feats.map((f) => limpia(f, pre, 0.035 * alto));
  const col = { type: "FeatureCollection", features: feats };
  const proj = geoMercator().rotate([75, 0]).fitHeight(alto, col);
  const p = geoPath(proj);
  const [[x0, y0], [x1, y1]] = p.bounds(col);
  // Centramos el mapa en x = 0.
  const dx = -(x0 + x1) / 2, dy = -y0;
  proj.translate([proj.translate()[0] + dx, proj.translate()[1] + dy]);
  const q = geoPath(proj);
  const r = (v) => Math.round(v * 10) / 10;
  const paises = feats.map((f) => {
    const iso = NUM2ISO[String(f.id).padStart(3, "0")];
    const [[bx0, by0], [bx1, by1]] = q.bounds(f);
    const [cx, cy] = q.centroid(f);
    // Trazado con 1 decimal: más ligero sin perder detalle a ningún zoom razonable.
    const d = q(f).replace(/-?\d+\.\d+/g, (m) => String(r(parseFloat(m))));
    return { iso, nombre: f.properties.name, d, bbox: [bx0, by0, bx1, by1].map(r), centro: [r(cx), r(cy)] };
  });
  const [[a0, b0], [a1, b1]] = q.bounds(col);
  return { paises, bbox: [a0, b0, a1, b1].map(r), proyeccion: proj };
}

if (process.argv[1] && process.argv[1].endsWith("mapa.mjs")) {
  const m = construirMapa();
  const [x0, y0, x1, y1] = m.bbox;
  console.log("bbox", m.bbox, "tamaño", Math.round(x1 - x0), "×", Math.round(y1 - y0));
  for (const c of m.paises.filter((c) => ["CUB", "CRI", "CHL", "URY", "HTI", "ECU", "MEX"].includes(c.iso))) console.log(c.iso, c.bbox, c.centro, c.d.length);
  if (process.argv[2]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0 - 50} ${y0 - 50} ${x1 - x0 + 100} ${y1 - y0 + 100}" width="${Math.round((x1 - x0) / 5)}" height="${Math.round((y1 - y0) / 5)}"><rect x="${x0 - 50}" y="${y0 - 50}" width="${x1 - x0 + 100}" height="${y1 - y0 + 100}" fill="#0b0f14"/>${m.paises.map((c) => `<path d="${c.d}" fill="${["CUB", "CRI", "CHL", "URY", "HTI"].includes(c.iso) ? "#fff" : "#1c2530"}" stroke="#3a4757" stroke-width="5"/>`).join("")}</svg>`;
    fs.writeFileSync(process.argv[2], svg);
  }
}
