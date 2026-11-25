// Comprueba las zonas seguras de Shorts, Reels y TikTok con las medidas del encargo:
// nada importante en los 220 px de arriba, en los 420 px de abajo ni a menos de 60 px de los lados.
// Mide los textos y las tarjetas visibles en la previsualización de HyperFrames en varios instantes.
//   (con `npx hyperframes preview --background` en marcha)  node tools/zonas-seguras.cjs [puerto] [t1,t2,...]
const { chromium } = require("playwright");
const ZONA = { izq: 60, der: 1080 - 60, arriba: 220, abajo: 1920 - 420 };
(async () => {
  const puerto = process.argv[2] || "3002";
  const tiempos = (process.argv[3] || "").split(",").filter(Boolean).map(Number);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(`http://localhost:${puerto}/api/projects/video/preview`, { waitUntil: "networkidle" });
  await p.waitForFunction(() => window.__timelines && window.__timelines.mundo && window.__timelines.subtitulos, null, { timeout: 60000 });
  await p.waitForTimeout(1500);
  let fallos = 0;
  for (const t of tiempos) {
    await p.evaluate((t) => {
      if (window.__hf && typeof window.__hf.seek === "function") window.__hf.seek(t);
      for (const k in window.__timelines) window.__timelines[k].seek(t, false);
      window.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: t } }));
    }, t);
    await p.waitForTimeout(250);
    const malos = await p.evaluate((Z) => {
      const visible = (el) => {
        for (let e = el; e && e.nodeType === 1; e = e.parentElement || e.parentNode) {
          const cs = getComputedStyle(e);
          if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return false;
          const op = e.getAttribute && e.getAttribute("opacity");
          if (op !== null && parseFloat(op) < 0.05) return false;
        }
        return true;
      };
      const piezas = [...document.querySelectorAll(".grupo .pal, #web, #fuente, #leyenda, #comentario, svg text, [id$='-tarjeta'], [id^='cub-rios'], [id^='cub-costa'], #cri-resp, #chl-rios, #chl-telefono, #uru-tarjeta, #hti-vul, #hti-lista")]
        .filter((el) => !el.closest("#hti-filas") && visible(el));
      const out = [];
      for (const el of piezas) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.right < 0 || r.left > 1080 || r.bottom < 0 || r.top > 1920) continue; // fuera de cuadro (de paso en un viaje)
        // Elementos que se están moviendo (dentro del mundo y en un viaje de cámara) se ignoran: no se pueden leer.
        const fuera = [];
        if (r.left < Z.izq - 1) fuera.push(`izq ${Math.round(r.left)}`);
        if (r.right > Z.der + 1) fuera.push(`der ${Math.round(r.right)}`);
        if (r.top < Z.arriba - 1) fuera.push(`arriba ${Math.round(r.top)}`);
        if (r.bottom > Z.abajo + 1) fuera.push(`abajo ${Math.round(r.bottom)}`);
        if (fuera.length) out.push(`${(el.id || el.tagName)} «${(el.textContent || "").trim().slice(0, 24)}» → ${fuera.join(", ")}`);
      }
      return out;
    }, ZONA);
    fallos += malos.length;
    console.log(`t=${t.toFixed(2)}s  ${malos.length ? "✗ " + malos.length : "✓"}${malos.length ? "\n   " + malos.join("\n   ") : ""}`);
  }
  await b.close();
  console.log(fallos ? `\n${fallos} piezas fuera de la zona segura` : "\nTodo dentro de la zona segura en los instantes comprobados.");
})();
