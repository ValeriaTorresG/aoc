/* ============================================================
   El arte del cosmos — piezas interactivas de halos.html
   Una por cada bloque de la explicación:
     01 mide tú la curva de rotación (Rubin & Ford)
     02 aleja la vista del disco hasta el halo
     03 mueve el cúmulo y curva la luz de fondo
     04 compara materia oscura contra MOND
   Depende de js/common.js (svgEl, reduceMotion) y de js/halos.js
   (vTotal, HALO), que aporta la física compartida.
   ============================================================ */

const LY_PER_KPC = 3261.6;
const G_KPC = 4.302e-6;             // kpc · M☉⁻¹ · (km/s)²
const SUP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };

/* 4,5 × 10¹¹ */
function sci(n) {
  const exp = Math.floor(Math.log10(n));
  const mant = (n / Math.pow(10, exp)).toFixed(1).replace('.', ',');
  return `${mant} × 10${String(exp).split('').map((d) => SUP[d]).join('')}`;
}

const nfNum = (n) => n.toLocaleString('es-ES');

/* Masa encerrada dentro de un radio, a partir de la misma curva: M = v²r/G */
const massWithin = (rKpc, f = 1) => vTotal(rKpc, f) ** 2 * rKpc / G_KPC;

/* Coordenada del puntero en unidades del viewBox */
function pointerX(svg, event, viewWidth = 600) {
  const rect = svg.getBoundingClientRect();
  return ((event.clientX - rect.left) / rect.width) * viewWidth;
}
function pointerY(svg, event, viewHeight = 300) {
  const rect = svg.getBoundingClientRect();
  return ((event.clientY - rect.top) / rect.height) * viewHeight;
}

/* Generador reproducible, para que la figura salga igual en cada visita */
function seeded(seed) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/* ============================================================
   01 · LA ANOMALÍA — mide la curva tú mismo
   ============================================================ */

function initAnomalyLab() {
  const svg = document.getElementById('labAnomaly');
  if (!svg) return;

  const GX = 300, GY = 62, GR = 205, R_MAX = 40;
  const plot = { x: 62, y: 128, w: 472, h: 128 };
  const X = (r) => plot.x + (r / R_MAX) * plot.w;
  const Y = (v) => plot.y + plot.h - (v / 260) * plot.h;

  const rnd = seeded(11);

  /* galaxia vista de canto */
  const gal = svgEl('g', { class: 'anomaly-galaxy' });
  gal.appendChild(svgEl('ellipse', { class: 'galaxy-disc galaxy-disc--flat', cx: GX, cy: GY, rx: GR, ry: 20 }));
  for (let i = 0; i < 90; i++) {
    const t = rnd() * 2 - 1;
    gal.appendChild(svgEl('circle', {
      class: 'dust',
      cx: (GX + t * GR).toFixed(1),
      cy: (GY + (rnd() - 0.5) * 26 * (1 - Math.abs(t) * 0.6)).toFixed(1),
      r: (rnd() * 1.6 + 0.5).toFixed(1)
    }));
  }
  gal.appendChild(svgEl('ellipse', { class: 'galaxy-core', cx: GX, cy: GY, rx: 22, ry: 13 }));
  svg.appendChild(gal);

  svg.appendChild(Object.assign(svgEl('text', { class: 'axis-label', x: 120, y: 24 }), { textContent: 'SE ACERCA' }));
  svg.appendChild(Object.assign(svgEl('text', { class: 'axis-label', x: 480, y: 24 }), { textContent: 'SE ALEJA' }));

  /* rendija del espectrógrafo */
  const slit = svgEl('g', { class: 'slit' });
  const slitLine = svgEl('line', { x1: GX, y1: 22, x2: GX, y2: 104, class: 'slit__line' });
  const slitDot = svgEl('circle', { cx: GX, cy: GY, r: 7, class: 'slit__dot' });
  slit.appendChild(slitLine);
  slit.appendChild(slitDot);
  svg.appendChild(slit);

  /* gráfico */
  const axes = svgEl('g', { class: 'axes' });
  axes.appendChild(svgEl('path', { d: `M${plot.x} ${plot.y + plot.h} H${plot.x + plot.w + 12} M${plot.x + plot.w + 4} ${plot.y + plot.h - 6} L${plot.x + plot.w + 16} ${plot.y + plot.h} L${plot.x + plot.w + 4} ${plot.y + plot.h + 6}` }));
  axes.appendChild(svgEl('path', { d: `M${plot.x} ${plot.y + plot.h} V${plot.y - 10} M${plot.x - 6} ${plot.y + 2} L${plot.x} ${plot.y - 12} L${plot.x + 6} ${plot.y + 2}` }));
  svg.appendChild(axes);

  let dExpected = '';
  for (let i = 0; i <= 60; i++) {
    const r = 0.6 + (R_MAX - 0.6) * (i / 60);
    dExpected += `${i ? 'L' : 'M'}${X(r).toFixed(1)} ${Y(vTotal(r, 0)).toFixed(1)}`;
  }
  svg.appendChild(svgEl('path', { class: 'curve curve--expected', d: dExpected }));

  svg.appendChild(Object.assign(svgEl('text', { class: 'axis-label plot-label', x: plot.x + 6, y: plot.y - 16, 'text-anchor': 'start' }), { textContent: 'VELOCIDAD' }));
  svg.appendChild(Object.assign(svgEl('text', { class: 'axis-label plot-label', x: plot.x + plot.w, y: plot.y + plot.h + 24, 'text-anchor': 'end' }), { textContent: 'RADIO →' }));
  svg.appendChild(Object.assign(svgEl('text', { class: 'axis-label plot-label plot-label--dim', x: X(34), y: Y(vTotal(34, 0)) + 20, 'text-anchor': 'middle' }), { textContent: 'LO ESPERADO' }));

  const dots = svgEl('g', { class: 'measures' });
  svg.appendChild(dots);

  const slider = document.getElementById('anomalySlit');
  const sweepBtn = document.getElementById('anomalySweep');
  const readout = document.getElementById('anomalyReadout');
  const measured = new Set();

  function measure(x) {
    const clamped = Math.max(GX - GR, Math.min(GX + GR, x));
    const signed = ((clamped - GX) / GR) * R_MAX;
    const r = Math.abs(signed);
    const v = vTotal(Math.max(0.8, r), 0.85);

    slitLine.setAttribute('x1', clamped);
    slitLine.setAttribute('x2', clamped);
    slitDot.setAttribute('cx', clamped);
    slit.classList.toggle('is-red', signed > 0);
    slit.classList.toggle('is-blue', signed < 0);

    const bin = Math.round(r / 1.6);
    if (r > 1.5 && !measured.has(bin)) {
      measured.add(bin);
      const dot = svgEl('circle', { class: 'measure-dot', cx: X(r), cy: Y(v), r: 4 });
      dot.style.setProperty('--shift', signed > 0 ? 'var(--coral)' : 'var(--ice)');
      dots.appendChild(dot);
    }

    readout.textContent = `r = ${r.toFixed(0)} kpc · ${signed >= 0 ? '+' : '−'}${Math.round(v)} km/s`
      + (measured.size > 6 ? '  ·  los puntos no bajan como la línea punteada' : '');
    if (slider.value !== String(Math.round(clamped))) slider.value = Math.round(clamped);
  }

  slider.min = GX - GR;
  slider.max = GX + GR;
  slider.addEventListener('input', () => measure(+slider.value));

  let dragging = false;
  svg.addEventListener('pointerdown', (e) => { dragging = true; svg.setPointerCapture(e.pointerId); measure(pointerX(svg, e)); });
  svg.addEventListener('pointermove', (e) => { if (dragging) measure(pointerX(svg, e)); });
  svg.addEventListener('pointerup', (e) => { dragging = false; svg.releasePointerCapture(e.pointerId); });

  sweepBtn.addEventListener('click', () => {
    const t0 = performance.now();
    const from = GX - GR, to = GX + GR;
    (function step(now) {
      const p = Math.min(1, (now - t0) / 3600);
      measure(from + (to - from) * p);
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  });

  measure(GX + GR * 0.55);
}

/* ============================================================
   02 · QUÉ ES UN HALO — aleja la vista
   ============================================================ */

function initScaleLab() {
  const svg = document.getElementById('labScale');
  if (!svg) return;

  const CX = 300, CY = 140, MAXPX = 240;
  const rnd = seeded(29);

  const halo = svgEl('circle', { class: 'scale-halo', cx: CX, cy: CY });
  const particles = svgEl('g', { class: 'halo-particles' });
  particles.style.transformOrigin = `${CX}px ${CY}px`;
  particles.style.opacity = 0.9;
  if (!reduceMotion) particles.classList.add('is-drifting');

  const cloud = Array.from({ length: 120 }, () => {
    const rLy = 900000 * Math.pow(rnd(), 0.55);
    const th = rnd() * Math.PI * 2;
    const el = svgEl('circle', { class: 'halo-particle', r: (rnd() * 1.5 + 0.6).toFixed(1) });
    if (!reduceMotion) el.style.animation = `twinkle ${(3 + rnd() * 5).toFixed(1)}s ease-in-out ${(rnd() * 5).toFixed(1)}s infinite`;
    particles.appendChild(el);
    return { rLy, th, el };
  });

  const disc = svgEl('ellipse', { class: 'galaxy-disc galaxy-disc--flat', cx: CX, cy: CY });
  const core = svgEl('ellipse', { class: 'galaxy-core', cx: CX, cy: CY });

  const sats = [163000, 280000, 520000].map((rLy, i) => {
    const el = svgEl('circle', { class: 'satellite', r: 5 - i * 0.8 });
    return { rLy, th: 0.8 + i * 2.2, el };
  });

  svg.appendChild(halo);
  svg.appendChild(particles);
  svg.appendChild(disc);
  svg.appendChild(core);
  const satG = svgEl('g', { class: 'satellites' });
  sats.forEach((s) => satG.appendChild(s.el));
  svg.appendChild(satG);

  const haloTag = Object.assign(svgEl('text', { class: 'scale-tag', x: CX, y: 0, 'text-anchor': 'middle' }), { textContent: 'HALO DE MATERIA OSCURA' });
  const discTag = Object.assign(svgEl('text', { class: 'scale-tag scale-tag--disc', x: CX, y: 0, 'text-anchor': 'middle' }), { textContent: 'DISCO VISIBLE' });
  svg.appendChild(haloTag);
  svg.appendChild(discTag);

  const barG = svgEl('g', { class: 'scale-bar' });
  const barLine = svgEl('path', { class: 'scale-bar__line', d: 'M40 268 H160 M40 262 V274 M160 262 V274' });
  const barText = Object.assign(svgEl('text', { class: 'axis-label', x: 100, y: 290 }), { textContent: '' });
  barG.appendChild(barLine);
  barG.appendChild(barText);
  svg.appendChild(barG);

  const slider = document.getElementById('scaleZoom');
  const readout = document.getElementById('scaleReadout');

  function render() {
    const z = +slider.value / 100;
    const halfLy = 55000 * Math.pow(15, z);      // media anchura de la vista
    const k = MAXPX / halfLy;                     // píxeles por año luz

    disc.setAttribute('rx', Math.max(1, 50000 * k));
    disc.setAttribute('ry', Math.max(0.6, 50000 * k * 0.2));
    core.setAttribute('rx', Math.max(1, 9000 * k));
    core.setAttribute('ry', Math.max(0.6, 9000 * k * 0.55));
    halo.setAttribute('r', 750000 * k);

    cloud.forEach((p) => {
      p.el.setAttribute('cx', (CX + Math.cos(p.th) * p.rLy * k).toFixed(1));
      p.el.setAttribute('cy', (CY + Math.sin(p.th) * p.rLy * k * 0.94).toFixed(1));
    });
    sats.forEach((s) => {
      s.el.setAttribute('cx', (CX + Math.cos(s.th) * s.rLy * k).toFixed(1));
      s.el.setAttribute('cy', (CY + Math.sin(s.th) * s.rLy * k * 0.9).toFixed(1));
    });

    haloTag.setAttribute('y', Math.max(18, CY - 750000 * k - 10));
    haloTag.style.opacity = z > 0.35 ? 1 : 0;
    discTag.setAttribute('y', Math.min(250, CY + Math.max(16, 50000 * k * 0.2) + 20));
    discTag.style.opacity = z < 0.55 ? 1 : 0.25;

    barText.textContent = `${nfNum(Math.round(120 / k / 1000) * 1000)} años luz`;

    const rKpc = halfLy / LY_PER_KPC;
    readout.textContent = `Vista de ${nfNum(Math.round(halfLy * 2 / 10000) * 10000)} años luz de ancho · `
      + `masa encerrada ≈ ${sci(massWithin(rKpc))} masas solares`;
  }

  slider.addEventListener('input', render);
  render();
}

/* ============================================================
   03 · LAS OTRAS PRUEBAS — lente gravitacional
   ============================================================ */

function initLensLab() {
  const svg = document.getElementById('labLens');
  if (!svg) return;

  const rnd = seeded(47);
  const sources = Array.from({ length: 46 }, () => ({
    x: 30 + rnd() * 540,
    y: 25 + rnd() * 250,
    size: 3 + rnd() * 3.5,
    el: null,
    ghost: null
  }));

  const ghosts = svgEl('g', { class: 'lens-ghosts' });
  const field = svgEl('g', { class: 'lens-field' });
  sources.forEach((s) => {
    s.ghost = svgEl('circle', { class: 'source-ghost', cx: s.x, cy: s.y, r: 1.6 });
    s.el = svgEl('ellipse', { class: 'source', rx: s.size, ry: s.size * 0.6 });
    ghosts.appendChild(s.ghost);
    field.appendChild(s.el);
  });
  svg.appendChild(ghosts);
  svg.appendChild(field);

  const ring = svgEl('circle', { class: 'einstein-ring', cx: 300, cy: 150 });
  const lens = svgEl('g', { class: 'lens' });
  lens.appendChild(svgEl('circle', { class: 'lens__glow', cx: 0, cy: 0, r: 46 }));
  lens.appendChild(svgEl('circle', { class: 'lens__core', cx: 0, cy: 0, r: 17 }));
  svg.appendChild(ring);
  svg.appendChild(lens);

  const slider = document.getElementById('lensMass');
  const truthBtn = document.getElementById('lensTruth');
  const readout = document.getElementById('lensReadout');

  let lx = 300, ly = 150, showTruth = false;

  function render() {
    const thetaE = 22 + (+slider.value / 100) * 55;   // radio de Einstein, en px
    ring.setAttribute('cx', lx);
    ring.setAttribute('cy', ly);
    ring.setAttribute('r', thetaE);
    lens.setAttribute('transform', `translate(${lx} ${ly})`);
    ghosts.style.opacity = showTruth ? 0.9 : 0;

    sources.forEach((s) => {
      const dx = s.x - lx, dy = s.y - ly;
      const d = Math.max(6, Math.hypot(dx, dy));
      // Lente puntual: la imagen se aleja del centro en θ_E²/θ
      const push = Math.min(90, (thetaE * thetaE) / d);
      const nx = dx / d, ny = dy / d;
      const ax = s.x + nx * push, ay = s.y + ny * push;
      const stretch = 1 + Math.min(3.2, (thetaE * thetaE) / (d * d) * 2.2);

      s.el.setAttribute('rx', s.size * stretch);
      s.el.setAttribute('ry', s.size * 0.6);
      s.el.setAttribute('transform',
        `translate(${ax.toFixed(1)} ${ay.toFixed(1)}) rotate(${(Math.atan2(ny, nx) * 180 / Math.PI + 90).toFixed(1)})`);
      s.el.classList.toggle('is-arc', stretch > 1.8);
    });

    readout.textContent = `Radio de Einstein: ${Math.round(thetaE)} px · `
      + (showTruth ? 'en gris, dónde están de verdad' : 'arrastra el cúmulo sobre el campo');
  }

  let dragging = false;
  svg.addEventListener('pointerdown', (e) => {
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    lx = pointerX(svg, e); ly = pointerY(svg, e);
    render();
  });
  svg.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    lx = pointerX(svg, e); ly = pointerY(svg, e);
    render();
  });
  svg.addEventListener('pointerup', (e) => { dragging = false; svg.releasePointerCapture(e.pointerId); });

  slider.addEventListener('input', render);
  truthBtn.addEventListener('click', () => {
    showTruth = !showTruth;
    truthBtn.setAttribute('aria-pressed', String(showTruth));
    render();
  });

  render();
}

/* ============================================================
   04 · LO QUE NO SABEMOS — materia oscura contra MOND
   ============================================================ */

function initTheoryLab() {
  const svg = document.getElementById('labTheory');
  if (!svg) return;

  const A0 = 3700;                               // a₀ de MOND en (km/s)²/kpc
  const rnd = seeded(83);
  const panelA = { x: 46, y: 60, w: 210, h: 150 };
  const panelB = { x: 340, y: 60, w: 200, h: 150 };
  const XA = (r) => panelA.x + (r / 40) * panelA.w;
  const YA = (v) => panelA.y + panelA.h - (v / 260) * panelA.h;

  /* MOND: fórmula de interpolación simple sobre la gravedad del disco */
  function vMond(r) {
    const vn2 = vTotal(r, 0) ** 2;
    return Math.sqrt(vn2 / 2 + Math.sqrt(vn2 * vn2 / 4 + vn2 * A0 * r));
  }

  const title = (x, y, t) => Object.assign(svgEl('text', { class: 'panel-title', x, y }), { textContent: t });
  svg.appendChild(title(panelA.x, 36, 'UNA GALAXIA'));
  svg.appendChild(title(panelB.x, 36, 'UN CÚMULO'));

  const axesA = svgEl('g', { class: 'axes' });
  axesA.appendChild(svgEl('path', { d: `M${panelA.x} ${panelA.y + panelA.h} H${panelA.x + panelA.w + 10}` }));
  axesA.appendChild(svgEl('path', { d: `M${panelA.x} ${panelA.y + panelA.h} V${panelA.y - 6}` }));
  svg.appendChild(axesA);

  // Medidas: la curva real con algo de dispersión, como en un artículo de verdad
  const data = [6, 11, 16, 21, 26, 31, 36].map((r) => ({ r, v: vTotal(r, 0.85) * (0.97 + rnd() * 0.06) }));
  data.forEach((d) => {
    svg.appendChild(svgEl('circle', { class: 'data-point', cx: XA(d.r), cy: YA(d.v), r: 3.5 }));
    svg.appendChild(svgEl('line', {
      class: 'data-error', x1: XA(d.r), x2: XA(d.r),
      y1: YA(d.v * 1.06), y2: YA(d.v * 0.94)
    }));
  });

  const model = svgEl('path', { class: 'curve curve--live model-curve' });
  svg.appendChild(model);
  svg.appendChild(Object.assign(svgEl('text', { class: 'axis-label plot-label', x: panelA.x + panelA.w, y: panelA.y + panelA.h + 22, 'text-anchor': 'end' }), { textContent: 'RADIO →' }));

  /* panel del cúmulo: barras */
  const baseY = panelB.y + panelB.h;
  const bar = (x, cls) => svgEl('rect', { class: `mass-bar ${cls}`, x, width: 54, y: baseY, height: 0 });
  const barNeeded = bar(panelB.x + 18, 'mass-bar--needed');
  const barModel = bar(panelB.x + 108, 'mass-bar--model');
  svg.appendChild(svgEl('path', { class: 'axes', d: `M${panelB.x} ${baseY} H${panelB.x + panelB.w}` }));
  svg.appendChild(barNeeded);
  svg.appendChild(barModel);
  svg.appendChild(Object.assign(svgEl('text', { class: 'axis-label', x: panelB.x + 45, y: baseY + 20 }), { textContent: 'MEDIDA' }));
  svg.appendChild(Object.assign(svgEl('text', { class: 'axis-label', x: panelB.x + 135, y: baseY + 20 }), { textContent: 'MODELO' }));
  const gapTag = Object.assign(svgEl('text', { class: 'gap-tag', x: panelB.x + 135, y: 0, 'text-anchor': 'middle' }), { textContent: '' });
  svg.appendChild(gapTag);

  const btnDark = document.getElementById('theoryDark');
  const btnMond = document.getElementById('theoryMond');
  const readout = document.getElementById('theoryReadout');

  let mode = 'dark';
  let shown = 1;          // 1 = curva de halo, 0 = curva MOND (se interpola)

  function curveAt(mix) {
    let d = '';
    for (let i = 0; i <= 60; i++) {
      const r = 1 + 39 * (i / 60);
      const v = mix * vTotal(r, 0.85) + (1 - mix) * vMond(r);
      d += `${i ? 'L' : 'M'}${XA(r).toFixed(1)} ${YA(v).toFixed(1)}`;
    }
    return d;
  }

  function paint() {
    model.setAttribute('d', curveAt(shown));
    const needed = panelB.h * 0.82;
    const modelH = mode === 'dark' ? needed : needed * 0.5;
    barNeeded.setAttribute('height', needed);
    barNeeded.setAttribute('y', baseY - needed);
    barModel.setAttribute('height', modelH);
    barModel.setAttribute('y', baseY - modelH);
    gapTag.setAttribute('y', baseY - modelH - 12);
    gapTag.textContent = mode === 'dark' ? 'ENCAJA' : 'FALTA LA MITAD';
    gapTag.classList.toggle('is-gap', mode !== 'dark');
  }

  function setMode(next) {
    mode = next;
    btnDark.setAttribute('aria-pressed', String(mode === 'dark'));
    btnMond.setAttribute('aria-pressed', String(mode === 'mond'));
    readout.textContent = mode === 'dark'
      ? 'Con halo de materia oscura: encaja en la galaxia y también en el cúmulo.'
      : 'Con MOND: encaja igual de bien en la galaxia, pero en el cúmulo falta la mitad de la masa.';

    const from = shown, to = mode === 'dark' ? 1 : 0, t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / 700);
      shown = from + (to - from) * (1 - Math.pow(1 - p, 3));
      paint();
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  btnDark.addEventListener('click', () => setMode('dark'));
  btnMond.addEventListener('click', () => setMode('mond'));
  setMode('dark');
}

document.addEventListener('DOMContentLoaded', () => {
  arranca('AnomalyLab', initAnomalyLab);
  arranca('ScaleLab', initScaleLab);
  arranca('LensLab', initLensLab);
  arranca('TheoryLab', initTheoryLab);
});
