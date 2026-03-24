/**
 * controllerUI.js — gestione interfaccia utente
 * Tooltip, pannello info, selezione continente, legenda, minimap, riquadri overseas.
 * Navigazione overseas con frecce ◀ ▶ + click su singolo territorio per zoom.
 */

const controllerUI = (() => {
  let _selectedEl   = null;
  let _selectedName = null;

  /* ── DATI TERRITORI OLTREOCEANO ─────────────── */
  // coords: [lon, lat] centro per lo zoom
  // zoomLevel: scala zoom approssimativa
  const OVERSEAS = {
    "Europe": [
      { nome: "Azzorre",    flag: "🇵🇹", coords: [-28.0,  38.5],  zoom: 6  },
      { nome: "Madeira",    flag: "🇵🇹", coords: [-17.0,  32.75], zoom: 9  },
      { nome: "Canarie",    flag: "🇪🇸", coords: [-15.5,  28.1],  zoom: 6  },
      { nome: "Ceuta",      flag: "🇪🇸", coords: [ -5.32, 35.89], zoom: 12 },
      { nome: "Guyana FR",  flag: "🇫🇷", coords: [-53.1,   3.9],  zoom: 5  },
      { nome: "Martinica",  flag: "🇫🇷", coords: [-61.0,  14.65], zoom: 10 },
      { nome: "Guadalupa",  flag: "🇫🇷", coords: [-61.55, 16.25], zoom: 9  },
      { nome: "Réunion",    flag: "🇫🇷", coords: [ 55.5,  -21.1], zoom: 9  },
      { nome: "Mayotte",    flag: "🇫🇷", coords: [ 45.15, -12.8], zoom: 10 },
    ],
    "North America": [
      { nome: "Hawaii",      flag: "🇺🇸", coords: [-157.8,  20.3], zoom: 5 },
      { nome: "Alaska",      flag: "🇺🇸", coords: [-153.0,  64.2], zoom: 3 },
      { nome: "Puerto Rico", flag: "🇺🇸", coords: [ -66.5,  18.2], zoom: 9 },
      { nome: "Groenlandia", flag: "🇩🇰", coords: [ -42.0,  71.7], zoom: 3 },
    ],
    "Africa": [
      { nome: "Melilla", flag: "🇪🇸", coords: [ -2.94, 35.29], zoom: 12 },
    ],
  };

  // Stato navigazione overseas
  // index -1 = vista continente principale, 0..n-1 = territorio overseas
  let _overseasIndex = -1;
  let _overseasList  = [];

  /* ── TOOLTIP ────────────────────────────────── */

  let _tooltipTimer = null;

  function showTooltip(event, nome) {
    const tt   = document.getElementById("tooltip");
    const info = CONTINENTI[nome];
    tt.style.display = "block";
    tt.style.opacity = "1";
    tt.innerHTML = `${nome}<small>${info ? info.area : ""}</small>`;
    moveTooltip(event);

    // Auto-nascondi dopo 8 secondi
    clearTimeout(_tooltipTimer);
    _tooltipTimer = setTimeout(() => {
      tt.style.transition = "opacity 0.6s ease";
      tt.style.opacity = "0";
      setTimeout(() => {
        tt.style.display = "none";
        tt.style.transition = "";
      }, 600);
    }, 1100);
  }

  function moveTooltip(event) {
    const tt        = document.getElementById("tooltip");
    const container = document.getElementById("map-container");
    const rect      = container.getBoundingClientRect();
    let x = event.clientX - rect.left + 14;
    let y = event.clientY - rect.top  - 14;
    if (x + 160 > rect.width)  x -= 170;
    tt.style.left = x + "px";
    tt.style.top  = y + "px";
  }

  function hideTooltip() {
    clearTimeout(_tooltipTimer);
    const tt = document.getElementById("tooltip");
    tt.style.display = "none";
    tt.style.opacity = "1";
    tt.style.transition = "";
  }

  /* ── SELEZIONE CONTINENTE ───────────────────── */

  function selezionaContinente(el, nome) {
    hideTooltip();

    if (_selectedEl === el) {
      _deselezionaCorrente();
      return;
    }

    if (_selectedEl) _deselezionaCorrente(false);

    _selectedEl   = el;
    _selectedName = nome;

    d3.select(el).classed("active", true);
    _aggiornaSelezioneLeggenda(nome);
    _aggiornaInfoPanel(nome);

    upgradeContinenteHd(nome, (hdEl) => {
      const target = hdEl || el;
      zoomSuContinente(target, nome);
    });

    zoomSuContinente(el, nome);
    applicaOmbra(nome);
    svg.on(".drag", null);

    // Inizializza navigazione overseas
    _overseasIndex = -1;
    _overseasList  = OVERSEAS[nome] || [];
    _renderOverseas();
    _renderFrecce();

    mostraMinimap();
  }

  function _deselezionaCorrente(resetZoom = true) {
    if (_selectedEl) d3.select(_selectedEl).classed("active", false);
    _selectedEl   = null;
    _selectedName = null;

    document.getElementById("selected-info").style.display = "none";
    _aggiornaSelezioneLeggenda(null);
    deselezionaContinente();
    nascondiMinimap();
    _nascondiOverseas();
    _nascondiNavigazioneOverseas();

    svg.call(zoom);

    if (resetZoom) {
      svg.transition().duration(600)
        .call(zoom.transform, d3.zoomIdentity);
    }
  }

  function resetSelezione() {
    _deselezionaCorrente(false);
  }

  /* ── PANNELLO INFO ──────────────────────────── */

  function _aggiornaInfoPanel(nome) {
    const info = CONTINENTI[nome];
    const box  = document.getElementById("selected-info");
    if (!info) return;
    box.style.display = "block";
    box.innerHTML = `
      <h3>${nome}</h3>
      <p>
        Superficie &nbsp;· ${info.area}<br>
        Paesi &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;· ${info.paesi}<br>
        Popolazione · ${info.pop}
      </p>`;
  }

  /* ── OVERSEAS PANELS (griglia badge) ─────────── */

  function _renderOverseas() {
    const list = _overseasList;
    const wrap = document.getElementById("overseas-panels");
    wrap.innerHTML = "";

    if (!list || list.length === 0) {
      wrap.style.display = "none";
      return;
    }

    wrap.style.display = "flex";

    requestAnimationFrame(() => {
      const info = document.getElementById("selected-info");
      const infoH = info && info.offsetHeight > 0 ? info.offsetHeight + 10 : 0;
      wrap.style.bottom = (54 + infoH) + "px";
    });

    list.forEach((item, idx) => {
      const div = document.createElement("div");
      div.className = "overseas-block" + (idx === _overseasIndex ? " overseas-active" : "");
      div.title = `Zoom su ${item.nome}`;
      div.innerHTML = `
        <div class="overseas-flag">${item.flag}</div>
        <div class="overseas-name">${item.nome}</div>
      `;
      div.addEventListener("click", () => _selezionaOverseas(idx));
      wrap.appendChild(div);
    });
  }

  function _nascondiOverseas() {
    const wrap = document.getElementById("overseas-panels");
    wrap.style.display = "none";
    wrap.innerHTML = "";
  }

  /* ── NAVIGAZIONE OVERSEAS (frecce) ─────────── */

  let _navLabelTimer = null;

  function _mostraLabelConTimer(testo) {
    const label = document.getElementById("overseas-nav-label");
    if (!label) return;
    label.textContent = testo;
    label.style.opacity = "1";
    label.style.transition = "";

    clearTimeout(_navLabelTimer);
    _navLabelTimer = setTimeout(() => {
      label.style.transition = "opacity 0.6s ease";
      label.style.opacity = "0";
    }, 1100);
  }

  function _renderFrecce() {
    _nascondiNavigazioneOverseas();

    if (_overseasList.length === 0) return;

    const container = document.getElementById("map-container");

    // Etichetta centrale
    const label = document.createElement("div");
    label.id = "overseas-nav-label";
    label.textContent = _nomePaginaCorrente();
    container.appendChild(label);

    // Avvia timer 8s anche al primo render
    _mostraLabelConTimer(_nomePaginaCorrente());

    // Freccia sinistra
    const btnL = document.createElement("button");
    btnL.id = "overseas-nav-left";
    btnL.className = "overseas-nav-btn";
    btnL.innerHTML = "&#8592;";
    btnL.title = "Territorio precedente";
    btnL.addEventListener("click", () => _navigaOverseas(-1));
    container.appendChild(btnL);

    // Freccia destra
    const btnR = document.createElement("button");
    btnR.id = "overseas-nav-right";
    btnR.className = "overseas-nav-btn";
    btnR.innerHTML = "&#8594;";
    btnR.title = "Territorio successivo";
    btnR.addEventListener("click", () => _navigaOverseas(+1));
    container.appendChild(btnR);
  }

  function _nascondiNavigazioneOverseas() {
    clearTimeout(_navLabelTimer);
    ["overseas-nav-left", "overseas-nav-right", "overseas-nav-label"]
      .forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
  }

  function _nomePaginaCorrente() {
    if (_overseasIndex === -1) {
      return _selectedName || "";
    }
    const t = _overseasList[_overseasIndex];
    return t ? t.nome : "";
  }

  function _aggiornaLabel() {
    _mostraLabelConTimer(_nomePaginaCorrente());
  }

  function _navigaOverseas(dir) {
    // Ciclo: continente (-1) → 0 → 1 → … → n-1 → continente (-1) → …
    const n = _overseasList.length;
    if (_overseasIndex === -1) {
      _overseasIndex = dir > 0 ? 0 : n - 1;
    } else {
      _overseasIndex += dir;
      if (_overseasIndex >= n)  _overseasIndex = -1;
      if (_overseasIndex < -1)  _overseasIndex = n - 1;
    }

    _renderOverseas();
    _aggiornaLabel();
    _eseguiZoomOverseas();
  }

  function _selezionaOverseas(idx) {
    _overseasIndex = idx;
    _renderOverseas();
    _aggiornaLabel();
    _eseguiZoomOverseas();
  }

  function _eseguiZoomOverseas() {
    if (_overseasIndex === -1) {
      // Torna al continente principale: ripristina vincolo pan e fai zoom
      ripristinaVincoloPan(_selectedEl, _selectedName);
      if (_selectedEl) zoomSuContinente(_selectedEl, _selectedName);
      return;
    }

    const t = _overseasList[_overseasIndex];
    if (!t) return;

    // Libera il vincolo pan PRIMA dello zoom (il territorio può essere fuori dal bbox del continente)
    liberaVincoloPan();
    _zoomSuCoordinate(t.coords[0], t.coords[1], t.zoom);
  }

  /* ── ZOOM SU COORDINATE GEOGRAFICHE ────────── */

  function _zoomSuCoordinate(lon, lat, zoomK) {
    // Converte lon/lat → pixel tramite la proiezione globale
    const [px, py] = projection([lon, lat]);

    const k  = Math.min(zoomK, 12);
    const tx = WIDTH  / 2 - px * k;
    const ty = HEIGHT / 2 - py * k;

    const targetTransform = d3.zoomIdentity.translate(tx, ty).scale(k);

    svg.transition()
      .duration(800)
      .ease(d3.easeCubicInOut)
      .call(zoom.transform, targetTransform);
  }

  /* ── LEGENDA ────────────────────────────────── */

  function _aggiornaSelezioneLeggenda(nome) {
    document.querySelectorAll(".legend-item").forEach(item => {
      item.classList.toggle("legend-selected", item.dataset.continent === nome);
    });
  }

  function _applicaHoverContinente(nome) {
    if (_selectedName) return;
    d3.selectAll(".continent").each(function() {
      d3.select(this).classed("legend-hover", this.dataset.continent === nome);
    });
  }

  function _rimuoviHoverContinente() {
    d3.selectAll(".continent").classed("legend-hover", false);
  }

  function initLegenda() {
    document.querySelectorAll(".legend-item").forEach(item => {
      const nome = item.dataset.continent;

      item.addEventListener("mouseenter", () => _applicaHoverContinente(nome));
      item.addEventListener("mouseleave", () => _rimuoviHoverContinente());

      item.addEventListener("click", () => {
        const pathEl = document.querySelector(`.continent[data-continent="${nome}"]`);
        if (pathEl) selezionaContinente(pathEl, nome);
      });
    });
  }

  return {
    showTooltip, moveTooltip, hideTooltip,
    selezionaContinente, resetSelezione,
    initLegenda
  };
})();
