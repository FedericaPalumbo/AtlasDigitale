/**
 * controllerMappa.js — gestione della mappa D3
 * Proiezione, zoom/pan, graticola, coordinate mouse.
 * Include: zoom su continente, ombra sui non-selezionati, minimap, pan vincolato.
 */

let WIDTH, HEIGHT;

const svg       = d3.select("#map-svg");
let   transform = d3.zoomIdentity;
let   gRoot;
let   gLayer;
let   projection, geoPath;

/* Stato selezione continente */
let _continenteBounds = null;
let _continenteSel    = null;

/* ── ZOOM ──────────────────────────────────────── */

const zoom = d3.zoom()
  .scaleExtent([1, 12])
  .filter(event => {
    // Lascia passare scroll e drag, ma non i pointerdown sui continenti
    if (event.type === "pointerdown" && event.target.classList.contains("continent")) return false;
    return !event.ctrlKey && !event.button;
  })
  .on("zoom", (event) => {
    const t = event.transform;
    const k = t.k;

    let clampedX, clampedY;

    if (_continenteSel && _continenteBounds && k > 1.15) {
      // Pan vincolato dentro il bounding box del continente
      const { x0, y0, x1, y1 } = _continenteBounds;
      const bw = (x1 - x0) * k;
      const bh = (y1 - y0) * k;

      const cx = -(x0 * k) + (WIDTH  - bw) / 2;
      const cy = -(y0 * k) + (HEIGHT - bh) / 2;

      const marginX = Math.max(0, (bw - WIDTH)  / 2);
      const marginY = Math.max(0, (bh - HEIGHT) / 2);

      clampedX = Math.min(cx + marginX, Math.max(cx - marginX, t.x));
      clampedY = Math.min(cy + marginY, Math.max(cy - marginY, t.y));
    } else {
      clampedX = Math.min(0, Math.max(WIDTH  - WIDTH  * k, t.x));
      clampedY = Math.min(0, Math.max(HEIGHT - HEIGHT * k, t.y));
    }

    transform = d3.zoomIdentity.translate(clampedX, clampedY).scale(k);
    gRoot.attr("transform", transform);
    _aggiornaMinimap();

    // Zoom-out fuori soglia → deseleziona
    if (_continenteSel && k < 1.15) {
      controllerUI.resetSelezione();
    }
  });

function initMappa() {
  const container = document.getElementById("map-container");
  WIDTH  = container.clientWidth;
  HEIGHT = container.clientHeight;

  const scale = Math.min(WIDTH / 960, HEIGHT / 500) * 153;

  projection = d3.geoEquirectangular()
    .scale(scale)
    .translate([WIDTH / 2, HEIGHT / 2]);

  geoPath = d3.geoPath().projection(projection);

  d3.select("#map-clip-rect")
    .attr("width",  WIDTH)
    .attr("height", HEIGHT);

  gRoot = d3.select("#map-clip-group");

  const graticule = d3.geoGraticule().step([20, 20]);

  gRoot.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "sphere")
    .attr("d", geoPath);

  gRoot.append("path")
    .datum(graticule())
    .attr("class", "graticule")
    .attr("d", geoPath);

  gLayer = gRoot.append("g");

  svg.call(zoom);

  svg.on("mousemove", function(event) {
    const [x, y] = d3.pointer(event);
    const tx = (x - transform.x) / transform.k;
    const ty = (y - transform.y) / transform.k;
    const coords = projection.invert([tx, ty]);
    if (!coords) return;
    const [lon, lat] = coords;
    const ns = lat >= 0 ? "N" : "S";
    const ew = lon >= 0 ? "E" : "W";
    document.getElementById("coord-display").textContent =
      `φ ${Math.abs(lat).toFixed(1)}°${ns} · λ ${Math.abs(lon).toFixed(1)}°${ew}`;
  });

  _creaMinimap();
}

/* ── ZOOM CONTROLS ─────────────────────────────── */

function initZoomControls() {
  document.getElementById("zoom-in").onclick  = () => svg.transition().call(zoom.scaleBy, 1.5);
  document.getElementById("zoom-out").onclick = () => svg.transition().call(zoom.scaleBy, 0.67);
  document.getElementById("reset-view").onclick = () => {
    deselezionaContinente();
    svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity);
    controllerUI.resetSelezione();
  };
}

/* ── ZOOM SU CONTINENTE ────────────────────────── */

function zoomSuContinente(pathEl, nome) {
  _continenteSel = nome;

  const bb = pathEl.getBBox();
  _continenteBounds = { x0: bb.x, y0: bb.y, x1: bb.x + bb.width, y1: bb.y + bb.height };

  const padding = 60;
  const scaleX  = (WIDTH  - padding * 2) / bb.width;
  const scaleY  = (HEIGHT - padding * 2) / bb.height;
  const k       = Math.min(scaleX, scaleY, 8);

  const cx = bb.x + bb.width  / 2;
  const cy = bb.y + bb.height / 2;

  const tx = WIDTH  / 2 - cx * k;
  const ty = HEIGHT / 2 - cy * k;

  const targetTransform = d3.zoomIdentity.translate(tx, ty).scale(k);

  svg.transition()
    .duration(800)
    .ease(d3.easeCubicInOut)
    .call(zoom.transform, targetTransform);
}

function deselezionaContinente() {
  _continenteSel    = null;
  _continenteBounds = null;
  _rimuoviOmbra();
}

/* Libera il vincolo pan per zoom su territori overseas fuori dal continente */
function liberaVincoloPan() {
  _continenteBounds = null;
}

/* Ripristina il vincolo pan sul continente (dopo il ritorno da un overseas) */
function ripristinaVincoloPan(pathEl, nome) {
  if (!pathEl) return;
  _continenteSel = nome;
  const bb = pathEl.getBBox();
  _continenteBounds = { x0: bb.x, y0: bb.y, x1: bb.x + bb.width, y1: bb.y + bb.height };
}

/* ── EFFETTO OMBRA ─────────────────────────────── */

function applicaOmbra(nomeSelezionato) {
  d3.selectAll(".continent").each(function() {
    const isSelected = this.dataset.continent === nomeSelezionato;
    d3.select(this)
      .classed("dimmed",      !isSelected)
      .classed("highlighted",  isSelected);
  });
  d3.select(".sphere").classed("sphere-dimmed", true);
}

function _rimuoviOmbra() {
  d3.selectAll(".continent").classed("dimmed", false).classed("highlighted", false);
  d3.select(".sphere").classed("sphere-dimmed", false);
}

/* ── MINIMAP ───────────────────────────────────── */

let minimapSvg       = null;
let minimapGeoPath   = null;
const MINI_W = 200;
const MINI_H = 105;

function _creaMinimap() {
  const container = document.getElementById("minimap-container");
  if (!container) return;

  minimapSvg = d3.select("#minimap-svg");

  const miniScale = Math.min(MINI_W / 960, MINI_H / 500) * 153;
  const minimapProjection = d3.geoEquirectangular()
    .scale(miniScale)
    .translate([MINI_W / 2, MINI_H / 2]);
  minimapGeoPath = d3.geoPath().projection(minimapProjection);

  minimapSvg.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "mini-sphere")
    .attr("d", minimapGeoPath);
}

function popolaMinimap(world, continentMap) {
  if (!minimapSvg) return;

  const allGeoms = world.objects.countries.geometries;

  CONTINENTE_ORDER.forEach(cont => {
    const geoms = allGeoms.filter(g => continentMap[+g.id] === cont);
    if (!geoms.length) return;
    const merged = topojson.merge(world, geoms);
    const colore = CONTINENTI[cont]?.colore || "#e8ddd0";

    minimapSvg.append("path")
      .datum(merged)
      .attr("class", "mini-continent")
      .attr("d", minimapGeoPath)
      .attr("data-continent", cont)
      .style("fill", colore);
  });

  // Viewport rect
  minimapSvg.append("rect")
    .attr("id", "mini-viewport")
    .attr("fill", "rgba(90,74,58,0.08)")
    .attr("stroke", "rgba(90,74,58,0.8)")
    .attr("stroke-width", "1")
    .attr("rx", "1");

  _aggiornaMinimap();
}

function _aggiornaMinimap() {
  const rect = d3.select("#mini-viewport");
  if (rect.empty()) return;

  const t = transform;
  const vx0 = -t.x / t.k;
  const vy0 = -t.y / t.k;
  const vw  = WIDTH  / t.k;
  const vh  = HEIGHT / t.k;

  const scaleRatio = MINI_W / WIDTH;
  const rx = vx0 * scaleRatio;
  const ry = vy0 * scaleRatio;
  const rw = vw  * scaleRatio;
  const rh = vh  * scaleRatio;

  rect
    .attr("x",      Math.max(0, rx))
    .attr("y",      Math.max(0, ry))
    .attr("width",  Math.min(MINI_W, Math.max(4, rw)))
    .attr("height", Math.min(MINI_H, Math.max(4, rh)));
}

function mostraMinimap() {
  const c = document.getElementById("minimap-container");
  if (!c) return;
  // Posiziona subito sotto la legenda
  const legend = document.getElementById("legend-panel");
  if (legend) {
    const legendBottom = legend.offsetTop + legend.offsetHeight;
    c.style.top = (legendBottom + 8) + "px";
  }
  c.style.display = "block";
  _aggiornaMinimap();
}

function nascondiMinimap() {
  const c = document.getElementById("minimap-container");
  if (c) c.style.display = "none";
}
