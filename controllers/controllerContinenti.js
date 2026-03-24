/**
 * controllerContinenti.js — rendering continenti con Progressive HD Loading
 *
 * Strategia:
 *  1. Vista globale  → countries-110m (leggero, ~500KB, carica subito)
 *  2. Click continente → usa countries-50m (HD, ~1MB):
 *     - Si avvia un pre-fetch silenzioso 2s dopo il caricamento iniziale
 *     - Al click, se HD è pronto si usa subito; altrimenti si carica e si mostra un badge
 *     - Dopo il primo caricamento HD viene tenuto in cache: click successivi sono istantanei
 *     - Solo il continente selezionato + i bordi vengono aggiornati in HD
 */

const CONTINENTE_ORDER = [
  "Antarctica", "South America", "North America", "Africa",
  "Europe", "Asia", "Oceania"
];

const GEO_URL_LO = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const GEO_URL_HD = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const TOPO_URL   = "https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js";

let _worldLo          = null;
let _worldHd          = null;
let _hdLoading        = false;
let _hdQueue          = null;
let _continentMapData = null;

/* ── CARICAMENTO INIZIALE (bassa risoluzione) ─── */

function caricaContinenti() {
  fetch(GEO_URL_LO)
    .then(r => r.json())
    .then(world => _loadTopojson(world))
    .catch(() => _mostraFallback());
}

function _loadTopojson(world) {
  if (typeof topojson !== "undefined") { _disegnaMondoLo(world); return; }
  const script = document.createElement("script");
  script.src = TOPO_URL;
  script.onload = () => _disegnaMondoLo(world);
  document.head.appendChild(script);
}

function _disegnaMondoLo(world) {
  _worldLo          = world;
  _continentMapData = getContinentMap();
  const continentMap = _continentMapData;
  const allGeoms     = world.objects.countries.geometries;

  CONTINENTE_ORDER.forEach(cont => {
    const geoms = allGeoms.filter(g => continentMap[+g.id] === cont);
    if (!geoms.length) return;

    const merged = topojson.merge(world, geoms);
    const colore = CONTINENTI[cont]?.colore || "#e8ddd0";

    gLayer.append("path")
      .datum(merged)
      .attr("class", "continent")
      .attr("id", `continent-${_safeId(cont)}`)
      .attr("d", geoPath)
      .style("fill", colore)
      .attr("data-continent", cont)
      .attr("data-hd", "false")
      .on("mouseenter", function(event) {
        if (!_continenteSel) controllerUI.showTooltip(event, cont);
      })
      .on("mousemove", (event) => {
        if (!_continenteSel) controllerUI.moveTooltip(event);
      })
      .on("mouseleave", () => {
        if (!_continenteSel) controllerUI.hideTooltip();
      })
      .on("pointerdown", function(event) {
        this._pdX = event.clientX;
        this._pdY = event.clientY;
      })
      .on("pointerup", function(event) {
        const dx = Math.abs(event.clientX - (this._pdX || event.clientX));
        const dy = Math.abs(event.clientY - (this._pdY || event.clientY));
        if (dx > 4 || dy > 4) return;
        event.stopPropagation();
        controllerUI.selezionaContinente(this, cont);
      });
  });

  gLayer.append("path")
    .attr("id", "country-borders")
    .attr("data-hd", "false")
    .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
    .attr("fill", "none")
    .attr("stroke", "rgba(255,255,255,0.5)")
    .attr("stroke-width", "0.4")
    .attr("d", geoPath)
    .style("pointer-events", "none");

  popolaMinimap(world, continentMap);

  const loadingMsg = document.getElementById("loading-msg");
  if (loadingMsg) loadingMsg.style.display = "none";

  // Pre-fetch HD silenzioso dopo 2s
  setTimeout(_prefetchHd, 2000);
}

/* ── PRE-FETCH HD SILENZIOSO ─────────────────── */

function _prefetchHd() {
  if (_worldHd || _hdLoading) return;
  _hdLoading = true;
  fetch(GEO_URL_HD)
    .then(r => r.json())
    .then(world => {
      _worldHd   = world;
      _hdLoading = false;
      if (_hdQueue) {
        const { cont, callback } = _hdQueue;
        _hdQueue = null;
        _eseguiUpgradeHd(cont, callback);
      }
    })
    .catch(() => { _hdLoading = false; });
}

/* ── UPGRADE HD DEL CONTINENTE SELEZIONATO ─── */

function upgradeContinenteHd(cont, callback) {
  const pathEl = document.getElementById(`continent-${_safeId(cont)}`);
  if (pathEl && pathEl.dataset.hd === "true") {
    if (callback) callback(pathEl);
    return;
  }

  if (_worldHd) {
    _eseguiUpgradeHd(cont, callback);
    return;
  }

  _hdQueue = { cont, callback };

  if (!_hdLoading) {
    _hdLoading = true;
    _mostraLoadingHd(true);
    fetch(GEO_URL_HD)
      .then(r => r.json())
      .then(world => {
        _worldHd   = world;
        _hdLoading = false;
        _mostraLoadingHd(false);
        if (_hdQueue) {
          const q = _hdQueue;
          _hdQueue = null;
          _eseguiUpgradeHd(q.cont, q.callback);
        }
      })
      .catch(() => {
        _hdLoading = false;
        _mostraLoadingHd(false);
        if (callback) callback(pathEl);
      });
  }
}

function _eseguiUpgradeHd(cont, callback) {
  const continentMap = _continentMapData;
  const allGeoms     = _worldHd.objects.countries.geometries;
  const geoms        = allGeoms.filter(g => continentMap[+g.id] === cont);
  if (!geoms.length) { if (callback) callback(null); return; }

  const merged = topojson.merge(_worldHd, geoms);
  const pathEl = document.getElementById(`continent-${_safeId(cont)}`);
  if (!pathEl) { if (callback) callback(null); return; }

  d3.select(pathEl)
    .datum(merged)
    .attr("d", geoPath)
    .attr("data-hd", "true");

  // Aggiorna i bordi (una volta sola)
  const borders = document.getElementById("country-borders");
  if (borders && borders.dataset.hd === "false") {
    d3.select(borders)
      .datum(topojson.mesh(_worldHd, _worldHd.objects.countries, (a, b) => a !== b))
      .attr("d", geoPath)
      .attr("data-hd", "true");
  }

  if (callback) callback(pathEl);
}

/* ── BADGE CARICAMENTO HD ────────────────────── */

function _mostraLoadingHd(visible) {
  let el = document.getElementById("hd-loading-badge");
  if (!el) {
    el = document.createElement("div");
    el.id = "hd-loading-badge";
    el.style.cssText = [
      "position:absolute", "bottom:16px", "left:50%", "transform:translateX(-50%)",
      "background:rgba(50,40,30,0.82)", "color:#e8ddd0",
      "font-family:'DM Mono',monospace", "font-size:0.6rem",
      "letter-spacing:0.16em", "text-transform:uppercase",
      "padding:5px 14px", "border-radius:12px", "z-index:60",
      "pointer-events:none", "white-space:nowrap"
    ].join(";");
    document.getElementById("map-container").appendChild(el);
  }
  el.textContent = "Caricamento HD…";
  el.style.display = visible ? "block" : "none";
}

/* ── FALLBACK ─────────────────────────────────── */

function _mostraFallback() {
  const loadingMsg = document.getElementById("loading-msg");
  if (loadingMsg) loadingMsg.style.display = "none";
  svg.append("text")
    .attr("x", WIDTH / 2).attr("y", HEIGHT / 2)
    .attr("text-anchor", "middle")
    .attr("fill", "#b0a090")
    .attr("font-family", "DM Mono, monospace")
    .attr("font-size", "0.8rem")
    .text("Connessione internet necessaria per visualizzare la mappa");
}

function _safeId(nome) {
  return nome.toLowerCase().replace(/\s+/g, "-");
}
